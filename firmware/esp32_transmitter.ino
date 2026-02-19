/*
 * Staff Presence - ESP32 iBeacon Transmitter (Tag)
 * Use this code on the ESP32 that the staff member carries.
 * This device will broadast a unique UUID that the scanner detects.
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEBeacon.h>
#include <BLEAdvertising.h>

// --- CONFIGURATION ---
// IMPORTANT: This UUID must match the 'beacon_uuid' registered for the staff in the database.
// Format: 16 byte hex string (e.g. "EBBA4227-B67D-4F2A-A04E-C63E32C4119B")
#define BEACON_UUID "EBBA4227-B67D-4F2A-A04E-C63E32C4119B" 

BLEAdvertising *pAdvertising;

void setBeacon() {
    BLEBeacon oBeacon = BLEBeacon();
    oBeacon.setManufacturerId(0x4C00); // 0x4C00 is Apple's Company ID (iBeacon standard)
    oBeacon.setProximityUUID(BLEUUID(BEACON_UUID));
    oBeacon.setMajor(1);
    oBeacon.setMinor(1);
    
    BLEAdvertisementData oAdvertisementData = BLEAdvertisementData();
    oAdvertisementData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED 
    
    std::string strServiceData = "";
    strServiceData += (char)26;     // Len
    strServiceData += (char)0xFF;   // Type
    strServiceData += oBeacon.getData(); 
    oAdvertisementData.addData(strServiceData);
    
    pAdvertising->setAdvertisementData(oAdvertisementData);
    pAdvertising->setScanResponseData(oAdvertisementData);
}

void setup() {
    Serial.begin(115200);
    Serial.println("Initializing Staff iBeacon Transmitter...");

    // Create the BLE Device
    BLEDevice::init("Staff-Tag-01");

    // Create the Advertising object
    pAdvertising = BLEDevice::getAdvertising();

    // Configure the Beacon
    setBeacon();

    // Start advertising
    pAdvertising->start();
    
    Serial.println("Beacon is now broadcasting...");
    Serial.printf("UUID: %s\n", BEACON_UUID);
}

void loop() {
    // The ESP32 stays in advertising mode automatically.
    // We can put it to sleep for a bit to save battery if needed,
    // but for simple testing, we just wait.
    delay(1000);
}
