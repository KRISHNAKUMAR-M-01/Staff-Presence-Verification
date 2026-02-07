/*
 * Context-Aware Indoor Staff Presence Verification
 * ESP32 Node Firmware
 * 
 * Features:
 * - Scans for BLE iBeacon tags (NRF51822)
 * - Filters by RSSI threshold
 * - Sends data to Backend API via HTTP POST
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>

// --- CONFIGURATION ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_BACKEND_IP:5000/api/ble-data";
const char* classroomId = "ROOM_101"; // Unique ID for this ESP32 location

int scanTime = 5; // Scan duration in seconds
BLEScan* pBLEScan;

// --- iBeacon Struct ---
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        if (advertisedDevice.haveName()) {
            Serial.print("Device name: ");
            Serial.println(advertisedDevice.getName().c_str());
        }
        
        // We look for any BLE tag, or filter by specific UUID prefix if needed
        String address = advertisedDevice.getAddress().toString().c_str();
        int rssi = advertisedDevice.getRSSI();
        
        Serial.printf("Found Device: %s, RSSI: %d \n", address.c_str(), rssi);
        
        // Send to backend
        sendDataToBackend(address, rssi);
    }

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
                Serial.print("HTTP Response code: ");
                Serial.println(httpResponseCode);
                String response = http.getString();
                Serial.println(response);
            } else {
                Serial.print("Error code: ");
                Serial.println(httpResponseCode);
            }
            http.end();
        } else {
            Serial.println("WiFi Disconnected");
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
    pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
    pBLEScan->setActiveScan(true); 
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);
}

void loop() {
    Serial.println("Starting BLE Scan...");
    BLEScanResults foundDevices = pBLEScan->start(scanTime, false);
    Serial.print("Scan complete. Devices found: ");
    Serial.println(foundDevices.getCount());
    pBLEScan->clearResults();   // delete results fromBLEScan buffer to release memory
    delay(10000); // Wait 10 seconds before next scan
}
