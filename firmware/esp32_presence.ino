/*
 * Staff Presence - ESP32 Firmware
 * FIXED FOR MAXIMUM COMPATIBILITY
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

// --- CONFIGURATION ---
const char* ssid = "TEC_MECH 1";
const char* password = "12345678";
const char* serverUrl = "http://192.168.1.152:5000/api/ble-data";
const char* classroomId = "ROOM_101";

int scanTime = 5; 
BLEScan* pBLEScan;

// --- Helper function for Backend Communication ---
void sendDataToBackend(String uuid, int rssi) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        String jsonPayload = "{\"esp32_id\":\"" + String(classroomId) + 
                             "\",\"beacon_uuid\":\"" + uuid + 
                             "\",\"rssi\":" + String(rssi) + "}";

        int httpResponseCode = http.POST(jsonPayload);
        
        if (httpResponseCode > 0) {
            Serial.printf("HTTP %d: Sent UUID %s\n", httpResponseCode, uuid.c_str());
        } else {
            Serial.printf("HTTP Error %d\n", httpResponseCode);
        }
        http.end();
    } else {
        Serial.println("WiFi Disconnected");
    }
}

// --- BLE Callback Class ---
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        uint8_t* payload = advertisedDevice.getPayload();
        size_t payloadLength = advertisedDevice.getPayloadLength();
        int rssi = advertisedDevice.getRSSI();

        // Search for iBeacon pattern: 0x4C 0x00 0x02 0x15
        for (int i = 0; i < (int)payloadLength - 20; i++) {
            if (payload[i] == 0x4C && payload[i+1] == 0x00 && payload[i+2] == 0x02 && payload[i+3] == 0x15) {
                char uuidBuf[33];
                for (int j = 0; j < 16; j++) {
                    sprintf(&uuidBuf[j * 2], "%02X", payload[i + 4 + j]);
                }
                String uuid = String(uuidBuf);
                Serial.printf("  [iBeacon] UUID: %s | RSSI: %d\n", uuid.c_str(), rssi);
                sendDataToBackend(uuid, rssi);
                return; 
            }
        }
    }
};

void setup() {
    Serial.begin(115200);
    
    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi!");

    // Initialize BLE
    BLEDevice::init("");
    pBLEScan = BLEDevice::getScan();
    pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks(), false);
    pBLEScan->setActiveScan(true); 
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);
}

void loop() {
    Serial.println("Starting BLE Scan...");
    
    // Start scan - returns a pointer in the current core version
    BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
    
    if (foundDevices) {
        Serial.printf("Scan complete. Devices found: %d\n", foundDevices->getCount());
        pBLEScan->clearResults();   // Important to prevent memory leak
    }
    
    delay(5000); 
}
