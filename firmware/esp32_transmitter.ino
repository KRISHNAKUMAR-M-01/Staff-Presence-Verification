/*
 * Staff Presence - ESP32 iBeacon Transmitter (Tag)
 * Simplified "Fail-Proof" Version for v3.x.x Cores
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEBeacon.h>
#include <BLEAdvertising.h>

// Change this to match the UUID assigned to the staff member in your database
#define BEACON_UUID "EBBA4227-B67D-4F2A-A04E-C63E32C4119B" 

void setup() {
  Serial.begin(115200);
  delay(1000); // Give serial time to initialize
  
  Serial.println("Starting BLE...");
  BLEDevice::init("Staff-Tag-01");

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  
  BLEBeacon oBeacon = BLEBeacon();
  oBeacon.setManufacturerId(0x4C00); // Apple's Company ID (iBeacon standard)
  oBeacon.setProximityUUID(BLEUUID(BEACON_UUID));
  oBeacon.setMajor(1);
  oBeacon.setMinor(1);

  BLEAdvertisementData oAdvertisementData = BLEAdvertisementData();
  oAdvertisementData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED
  
  // Set the raw beacon data directly - most compatible way for newer cores
  oAdvertisementData.setManufacturerData(oBeacon.getData());
  
  pAdvertising->setAdvertisementData(oAdvertisementData);
  pAdvertising->setScanResponseData(oAdvertisementData); // Optional but helps some scanners
  
  pAdvertising->start();

  Serial.println("iBeacon IS BROADCASTING.");
  Serial.print("Target UUID: ");
  Serial.println(BEACON_UUID);
  Serial.println("You can now check this with nRF Connect on your phone.");
}

void loop() {
  // Flash the internal LED (usually GPIO 2) just to show it's alive
  #ifdef LED_BUILTIN
    digitalWrite(LED_BUILTIN, HIGH);
    delay(500);
    digitalWrite(LED_BUILTIN, LOW);
    delay(1500);
  #else
    delay(2000);
  #endif
}
