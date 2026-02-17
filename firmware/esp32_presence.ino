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
const char* ssid = "Gandhi Ground floor 5G";
const char* password = "54641729";
const char* serverUrl = "http://192.168.1.7:5000/api/ble-data";
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
            Serial.print("HTTP Response code: ");
            Serial.println(httpResponseCode);
        } else {
            Serial.print("Error code: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    } else {
        Serial.println("WiFi Disconnected");
    }
}

// --- BLE Callback Class ---
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    // This signature uses basic object passing for better compatibility across core versions
    void onResult(BLEAdvertisedDevice advertisedDevice) {
        String address = advertisedDevice.getAddress().toString().c_str();
        int rssi = advertisedDevice.getRSSI();
        
        Serial.printf("Found Device: %s, RSSI: %d \n", address.c_str(), rssi);
        
        // Pass to the sender function
        sendDataToBackend(address, rssi);
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
    
    // Start scan and clear results from memory
    pBLEScan->start(scanTime, false);
    pBLEScan->clearResults();   
    
    Serial.println("Scan complete.");
    delay(10000); 
}