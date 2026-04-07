/*
 * Staff Presence - ESP32 Firmware
 * V5: ROBUST DUAL-MODE (Hardware Tag Scanner + Mobile Verification Mailbox)
 *
 * Fixes in V5:
 *  - WiFi auto-reconnect in loop() to survive AP restarts
 *  - HTTP connection timeout set to avoid infinite hangs
 *  - BLE scan stopped before HTTP POST (avoids BLE/WiFi antenna conflict on ESP32)
 *  - iBeacon UUID formatted with dashes (standard UUID format) for DB matching
 *  - classroomId must EXACTLY match the esp32_id field in the Classroom DB record
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <map>
#include <vector>
#include <numeric>

// ── CONFIGURATION ─────────────────────────────────────────────────────────────
// WiFi credentials
const char* ssid     = "Thorfinn";
const char* password = "12345677";

// Backend URL — must match your Render deployment
const char* serverUrl = "https://staff-presence-backend.onrender.com/api/ble-data";

// ⚠️  MUST match the esp32_id field for THIS room in the Classroom collection (case-insensitive, stored uppercase)
const char* classroomId = "COMPUTERLAB";

// BLE GATT UUIDs for Mobile Verification (must match SoftBeacon.jsx)
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Scanner / reporting settings
#define SCAN_TIME        4      // BLE scan window in seconds
#define READINGS_WINDOW  1     // Report after 1+ readings (instant live tracking)
#define RSSI_THRESHOLD   -90   // Ignore signals weaker than -90 dBm (reduce noise)
#define HTTP_TIMEOUT_MS  8000  // Max time to wait for backend response

// ── Globals ────────────────────────────────────────────────────────────────────
BLEScan*   pBLEScan       = nullptr;
BLEServer* pServer        = nullptr;
bool       mobileConnected = false;
int        lastMobileRssi  = -50;
esp_bd_addr_t current_remote_bda = {0};
std::map<std::string, std::vector<int>> tagAccumulator;

// ── WiFi Helper ────────────────────────────────────────────────────────────────
void ensureWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;
    Serial.println("\n[WiFi] Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    int tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 20) {
        delay(500);
        Serial.print(".");
        tries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] ✅ Reconnected. IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        Serial.println("\n[WiFi] ❌ Reconnect failed, will retry next cycle.");
    }
}

// ── GAP CALLBACK: Capture real-time RSSI of connected phone ───────────────────
void my_gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    if (event == ESP_GAP_BLE_READ_RSSI_COMPLETE_EVT) {
        if (param->read_rssi_cmpl.status == ESP_BT_STATUS_SUCCESS) {
            lastMobileRssi = param->read_rssi_cmpl.rssi;
            Serial.printf("📶 [Signal] Live Mobile RSSI: %d dBm\n", lastMobileRssi);
        }
    }
}

// ── Helper: POST detection data to backend ─────────────────────────────────────
void reportToBackend(String staffUuid, int rssi, String method) {
    ensureWiFi();
    if (WiFi.status() != WL_CONNECTED) {
        Serial.printf("[Offline] Cannot report %s — WiFi not available.\n", staffUuid.c_str());
        return;
    }

    WiFiClientSecure client;
    client.setInsecure(); // Accept self-signed / Let's Encrypt certs on Render

    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT_MS);

    String payload = "{\"esp32_id\":\"" + String(classroomId) +
                     "\",\"beacon_uuid\":\"" + staffUuid +
                     "\",\"rssi\":"          + String(rssi) +
                     ",\"method\":\""        + method + "\"}";

    Serial.printf("[HTTP] Sending → esp32_id=%s  uuid=%s  rssi=%d\n",
                  classroomId, staffUuid.c_str(), rssi);

    int code = http.POST(payload);

    if (code > 0) {
        String body = http.getString();
        Serial.printf("[HTTP] ✅ %d: %s\n", code, body.c_str());
    } else {
        Serial.printf("[HTTP] ❌ Error: %s\n", http.errorToString(code).c_str());
    }
    http.end();
}

// ── CALLBACK: Phone writes its Staff UUID to the ESP32 characteristic ──────────
class MobileMailbox : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) override {
        std::string val = pChar->getValue();
        if (val.length() > 0) {
            String staffUuid = String(val.c_str());
            staffUuid.trim();
            staffUuid.toUpperCase();

            // Read RSSI immediately before reporting
            esp_ble_gap_read_rssi(current_remote_bda);
            delay(50); // Brief wait for GAP callback to fire

            Serial.printf("\n📱 [Mobile] Staff UUID: %s | RSSI: %d dBm\n",
                          staffUuid.c_str(), lastMobileRssi);
            reportToBackend(staffUuid, lastMobileRssi, "mobile_verification");
        }
    }
};

// ── CALLBACK: BLE Server connection events ─────────────────────────────────────
class ServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pSrv, esp_ble_gatts_cb_param_t *param) override {
        memcpy(current_remote_bda, param->connect.remote_bda, 6);
        mobileConnected = true;
        lastMobileRssi  = -50; // reset
        Serial.println("📱 Mobile phone connected.");
        esp_ble_gap_read_rssi(current_remote_bda);
    }

    void onDisconnect(BLEServer* pSrv) override {
        mobileConnected = false;
        Serial.println("📱 Mobile phone disconnected. Restarting advertising…");
        delay(200);
        pSrv->getAdvertising()->start();
    }
};

// ── CALLBACK: iBeacon tag scanner ─────────────────────────────────────────────
class TagScanCallback : public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice dev) override {
        int    rssi    = dev.getRSSI();
        String devName = String(dev.getName().c_str());
        String devAddr = String(dev.getAddress().toString().c_str());

        if (rssi < RSSI_THRESHOLD) return; // Too weak — ignore

        if (devName.length() > 0) {
            Serial.printf("🔍 [Scan] \"%s\" | %s | RSSI: %d\n",
                          devName.c_str(), devAddr.c_str(), rssi);
        }

        // Parse iBeacon payload (Apple Prefix: 4C 00 02 15)
        const uint8_t* pay = dev.getPayload();
        size_t         len = dev.getPayloadLength();

        for (int i = 0; i < (int)len - 20; i++) {
            if (pay[i]   == 0x4C && pay[i+1] == 0x00 &&
                pay[i+2] == 0x02 && pay[i+3] == 0x15) {

                // Extract the 16-byte UUID and format as 32 hex chars (no dashes)
                char uuidBuf[33];
                for (int j = 0; j < 16; j++) {
                    sprintf(&uuidBuf[j * 2], "%02X", pay[i + 4 + j]);
                }
                uuidBuf[32] = '\0';

                tagAccumulator[std::string(uuidBuf)].push_back(rssi);
                Serial.printf("✅ iBeacon: UUID=%s | RSSI=%d\n", uuidBuf, rssi);
                return;
            }
        }
    }
};

// ── Setup ──────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n🚀 ESP32 Presence Firmware V5 Starting…");

    // --- WiFi ---
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("[WiFi] Connecting");
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.printf("\n[WiFi] ✅ Connected. IP: %s\n", WiFi.localIP().toString().c_str());

    // --- BLE Stack ---
    BLEDevice::init(classroomId); // Device name = classroomId (shown in BLE scanner)
    BLEDevice::setCustomGapHandler(my_gap_event_handler);

    // --- GATT Server (Mobile Verification) ---
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());

    BLEService        *pService = pServer->createService(SERVICE_UUID);
    BLECharacteristic *pChar   = pService->createCharacteristic(
        CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_WRITE);
    pChar->setCallbacks(new MobileMailbox());
    pService->start();

    BLEAdvertising *pAdv = BLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->setScanResponse(true);
    pAdv->setMinPreferred(0x06); // Helps with iPhone connectivity
    pAdv->setMaxPreferred(0x12);
    pAdv->start();
    Serial.println("[BLE] ✅ GATT server advertising as: " + String(classroomId));

    // --- BLE Scanner (iBeacon tag detection) ---
    pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(new TagScanCallback(), false);
    pBLEScan->setActiveScan(true);
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);

    Serial.println("✅ Dual-Mode Ready: scanning for iBeacon tags + accepting mobile connections.");
    Serial.printf("   Room ESP32 ID : %s\n", classroomId);
    Serial.printf("   Backend URL   : %s\n", serverUrl);
}

// ── Main Loop ─────────────────────────────────────────────────────────────────
void loop() {
    // Ensure WiFi is healthy before every cycle
    ensureWiFi();

    Serial.println("\n─── BLE Scan Cycle ─────────────────────────────");
    tagAccumulator.clear();

    // Run BLE scan (this temporarily pauses advertising — reconnected phones just re-auto-connect)
    BLEScanResults* results = pBLEScan->start(SCAN_TIME, false);
    pBLEScan->clearResults();

    // Report any iBeacon tags found in this window
    for (auto& entry : tagAccumulator) {
        const std::string&  uuid     = entry.first;
        std::vector<int>&   readings = entry.second;

        if ((int)readings.size() >= READINGS_WINDOW) {
            int sum     = std::accumulate(readings.begin(), readings.end(), 0);
            int avgRssi = sum / (int)readings.size();
            reportToBackend(String(uuid.c_str()), avgRssi, "hardware_tag");
        }
    }

    // If a mobile is currently connected, refresh RSSI reading
    if (mobileConnected) {
        esp_ble_gap_read_rssi(current_remote_bda);
        Serial.printf("[BLE] Mobile still connected. RSSI: %d dBm\n", lastMobileRssi);
    }

    delay(500); // Brief pause before next cycle
}
