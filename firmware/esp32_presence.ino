/*
 * Staff Presence - ESP32 Firmware
 * V4: FULL DUAL-MODE (Hardware Tag Scanner + Mobile Verification Mailbox)
 *
 * This version supports BOTH ways for a staff member to be detected:
 * 1. AUTOMATIC: Scans for physical staff iBeacon tags (Averaged RSSI).
 * 2. MOBILE: Accepts a physical BLE connection from the staff phone.
 */

#include <WiFi.h>
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

// ── CONFIGURATION ──────────────────────────────────────────────────────────
const char* ssid        = "Thorfinn";
const char* password    = "12345677";
const char* serverUrl   = "http://10.31.158.78:5000/api/ble-data";
const char* classroomId = "COMPUTERLAB";

// BLE UUIDs for Mobile Verification
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Scanner settings
const int scanTime = 5; // seconds
const int MIN_READINGS_TO_SEND = 1;
const int RSSI_THRESHOLD = -120; // Lowered to include all signals for debugging

// ── Globals ─────────────────────────────────────────────────────────────────
BLEScan* pBLEScan;
BLEServer* pServer;
bool mobileConnected = false;
int lastMobileRssi = -30;               // Signal strength holder
esp_bd_addr_t current_remote_bda = {0}; // Remote phone address
std::map<std::string, std::vector<int>> tagAccumulator;

// ── GAP CALLBACK: Capture the Real-time RSSI ─────────────────────────────────
void my_gap_event_handler(esp_gap_ble_cb_event_t event, esp_ble_gap_cb_param_t *param) {
    if (event == ESP_GAP_BLE_READ_RSSI_COMPLETE_EVT) {
        if (param->read_rssi_cmpl.status == ESP_BT_STATUS_SUCCESS) {
            lastMobileRssi = param->read_rssi_cmpl.rssi;
            Serial.printf("📶 [Signal] Live Mobile RSSI: %d dBm\n", lastMobileRssi);
        }
    }
}

// ── Helper: Send detection to backend ──────────────────────────────────────
void reportToBackend(String staffUuid, int rssi, String method) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.printf("[Offline Mode] Saw %s but WiFi is down.\n", staffUuid.c_str());
        return;
    }
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\"esp32_id\":\"" + String(classroomId) +
                     "\",\"beacon_uuid\":\"" + staffUuid +
                     "\",\"rssi\":" + String(rssi) + 
                     ",\"method\":\"" + method + "\"}";

    int code = http.POST(payload);
    Serial.printf("[%s] %s | Avg RSSI: %d | HTTP: %d\n", method.c_str(), staffUuid.c_str(), rssi, code);
    http.end();
}

// ── CALLBACK: When phone "writes" its identity to the ESP32 ─────────────────
class MobileMailbox : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) {
        String val = pChar->getValue();
        if (val.length() > 0) {
            String staffUuid = val;
            staffUuid.toUpperCase();
            
            // Trigger a real RSSI read from the Bluetooth stack
            esp_ble_gap_read_rssi(current_remote_bda);
            
            Serial.printf("\n📱 [Mobile Verification] Staff: %s | Real RSSI: %d\n", staffUuid.c_str(), lastMobileRssi);
            reportToBackend(staffUuid, lastMobileRssi, "mobile_verification");
        }
    }
};

class ServerCallbacks : public BLEServerCallbacks {
    // Override onConnect to capture the phone's MAC address
    void onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t *param) {
        memcpy(current_remote_bda, param->connect.remote_bda, 6);
        mobileConnected = true;
        Serial.println("📱 Mobile Connected.");
        esp_ble_gap_read_rssi(current_remote_bda); // Initial read
    }
    
    void onDisconnect(BLEServer* pServer) {
        mobileConnected = false;
        Serial.println("📱 Mobile Disconnected.");
        pServer->getAdvertising()->start();
    }
};

// ── CALLBACK: When scanning for physical tags ──────────────────────────────
class TagScanCallback : public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice dev) {
        int rssi = dev.getRSSI();
        String devName = dev.getName().c_str();
        String devAddr = dev.getAddress().toString().c_str();

        // 1. Skip very weak or invalid signals
        if (rssi < RSSI_THRESHOLD) return;

        // DEBUG: Print details of anything that starts with "Staff" or "Tag"
        if (devName.length() > 0) {
            Serial.printf("🔍 [Scanner] Found: \"%s\" (Addr: %s) | RSSI: %d\n", devName.c_str(), devAddr.c_str(), rssi);
        }

        uint8_t* pay = dev.getPayload();
        size_t len = dev.getPayloadLength();

        // 2. SEARCH FOR IBEACON (Look for Apple Prefix 4C 00 02 15)
        for (int i = 0; i < (int)len - 20; i++) {
            if (pay[i] == 0x4C && pay[i+1] == 0x00 && pay[i+2] == 0x02 && pay[i+3] == 0x15) {
                char buf[33];
                for (int j = 0; j < 16; j++) sprintf(&buf[j*2], "%02X", pay[i+4+j]);
                tagAccumulator[std::string(buf)].push_back(rssi);
                
                Serial.printf("✅ iBeacon Found! UUID: %s | RSSI: %d\n", buf, rssi);
                return;
            }
        }
    }
};


// ── Setup ────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println("\n✅ WiFi OK.");

    BLEDevice::init(classroomId);
    BLEDevice::setCustomGapHandler(my_gap_event_handler);

    // 1. Setup GATT Server (Mobile Verification Mode)
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());
    BLEService *pService = pServer->createService(SERVICE_UUID);
    BLECharacteristic *pChar = pService->createCharacteristic(CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_WRITE);
    pChar->setCallbacks(new MobileMailbox());
    pService->start();

    BLEAdvertising *pAdv = BLEDevice::getAdvertising();
    pAdv->addServiceUUID(SERVICE_UUID);
    pAdv->setScanResponse(true);
    pAdv->start();

    // 2. Setup Scanner (Hardware Tag Mode)
    pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(new TagScanCallback(), false);
    pBLEScan->setActiveScan(true);
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);

    Serial.println("🚀 Dual-Mode Active: Scanning for Tags + Waiting for Mobile.");
}

void loop() {
    Serial.println("\n--- BLE Scan Window (Scanning for Tags) ---");
    tagAccumulator.clear();
    
    // Start scanning for hardware tags
    BLEScanResults* results = pBLEScan->start(scanTime, false);
    pBLEScan->clearResults();

    // Process found tags
    for (auto& entry : tagAccumulator) {
        const std::string& uuid = entry.first;
        std::vector<int>&  readings = entry.second;

        if ((int)readings.size() >= MIN_READINGS_TO_SEND) {
            int sum = std::accumulate(readings.begin(), readings.end(), 0);
            int avgRssi = sum / (int)readings.size();
            reportToBackend(String(uuid.c_str()), avgRssi, "hardware_tag");
        }
    }

    delay(2000); // Wait between cycles
}
