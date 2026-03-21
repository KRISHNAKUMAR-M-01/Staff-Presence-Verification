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
const char* ssid        = "TEC_MECH 1";
const char* password    = "12345678";
const char* serverUrl   = "http://192.168.1.152:5000/api/ble-data";
const char* classroomId = "ROOM_101";

// BLE UUIDs for Mobile Verification
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Scanner settings
const int scanTime = 5; // seconds
const int MIN_READINGS_TO_SEND = 2;
const int RSSI_THRESHOLD = -75; // Signals weaker than -75dBm are ignored

// ── Globals ─────────────────────────────────────────────────────────────────
BLEScan* pBLEScan;
BLEServer* pServer;
bool mobileConnected = false;
std::map<std::string, std::vector<int>> tagAccumulator;

// ── Helper: Send detection to backend ──────────────────────────────────────
void reportToBackend(String staffUuid, int rssi, String method) {
    if (WiFi.status() != WL_CONNECTED) return;
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
        std::string val = pChar->getValue();
        if (val.length() > 0) {
            String staffUuid = String(val.c_str());
            staffUuid.toUpperCase();
            Serial.printf("\n📱 [Mobile Verification] Staff: %s\n", staffUuid.c_str());
            reportToBackend(staffUuid, -30, "mobile_verification");
        }
    }
};

class ServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer)    { mobileConnected = true;  Serial.println("📱 Mobile Connected."); }
    void onDisconnect(BLEServer* pServer) { mobileConnected = false; Serial.println("📱 Mobile Disconnected."); pServer->getAdvertising()->start(); }
};

// ── CALLBACK: When scanning for physical tags ──────────────────────────────
class TagScanCallback : public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice dev) {
        uint8_t* pay = dev.getPayload();
        size_t len = dev.getPayloadLength();
        int rssi = dev.getRSSI();

        // Skip weak signals (wall-bleed prevention)
        if (rssi < RSSI_THRESHOLD) return;

        // Search for iBeacon pattern 0x4C 0x00 0x02 0x15
        for (int i = 0; i < (int)len - 20; i++) {
            if (pay[i] == 0x4C && pay[i+1] == 0x00 && pay[i+2] == 0x02 && pay[i+3] == 0x15) {
                char buf[33];
                for (int j = 0; j < 16; j++) sprintf(&buf[j*2], "%02X", pay[i+4+j]);
                tagAccumulator[std::string(buf)].push_back(rssi);
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
