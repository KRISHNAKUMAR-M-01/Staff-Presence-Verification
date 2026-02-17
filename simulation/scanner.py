import asyncio
import aiohttp
import time
import struct
from bleak import BleakScanner

# Configuration
BACKEND_URL = "http://localhost:5000/api/ble-data"
ESP32_ID = "SIMULATED_LAPTOP_01"  # This acts as the Classroom/Location ID
RSSI_THRESHOLD = -80
SEND_INTERVAL = 2.0  # limit backend updates to once every 2 seconds per device

# iBeacon Manufacturer ID (Apple)
IBEACON_MFG_ID = 0x004C

# Global state
queue = asyncio.Queue()
last_sent = {} # {uuid: timestamp}

async def send_data(session, uuid, rssi):
    """Send detected presence to the backend."""
    payload = {
        "esp32_id": ESP32_ID,
        "beacon_uuid": uuid,
        "rssi": rssi
    }
    try:
        async with session.post(BACKEND_URL, json=payload) as response:
            try:
                resp_data = await response.json()
                print(f"Server Response for {uuid}: {response.status}")
            except:
                print(f"Server Response for {uuid}: {response.status}")
    except Exception as e:
        print(f"Failed to send data: {e}")

def parse_ibeacon(manufacturer_data):
    """
    Parse iBeacon data from manufacturer specific data.
    Returns UUID string if valid iBeacon, else None.
    """
    if IBEACON_MFG_ID not in manufacturer_data:
        return None
    
    data = manufacturer_data[IBEACON_MFG_ID]
    # iBeacon structure: 0x02 (type) + 0x15 (length) + UUID (16 bytes) + Major (2) + Minor (2) + TxPower (1)
    if len(data) >= 23 and data[0] == 0x02 and data[1] == 0x15:
        uuid_bytes = data[2:18]
        # Format as UUID string: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
        uuid_str = "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}".format(*uuid_bytes).upper()
        return uuid_str
    return None

def detection_callback(device, advertisement_data):
    """
    Callback for BleakScanner. Called for every received advertisement.
    """
    uuid = parse_ibeacon(advertisement_data.manufacturer_data)
    
    # Fallback to name if UUID not found (for testing with non-iBeacon devices if needed)
    # But strictly speaking we want iBeacons. 
    
    rssi = advertisement_data.rssi

    # DEBUG: Print all devices to help troubleshoot
    # print(f"Seen: {device.name} | RSSI: {rssi} | Mfg: {advertisement_data.manufacturer_data.keys()}")
    
    if uuid and rssi > RSSI_THRESHOLD:
        # We push to queue to handle sending async
        queue.put_nowait((uuid, rssi))
    elif rssi > RSSI_THRESHOLD:
         # Debugging: show devices with strong signal that AREN'T matching our iBeacon filter
         # This helps identifying if the phone is seen but the packet format is different
         if device.name:
             print(f"Ignored: {device.name} (RSSI: {rssi}) - Not an iBeacon or wrong ID")

async def worker(session):
    """
    Worker to process the queue and send data to backend.
    """
    print("Worker started processing queue...")
    while True:
        uuid, rssi = await queue.get()
        
        now = time.time()
        last_time = last_sent.get(uuid, 0)
        
        # Throttle updates to backend
        if now - last_time > SEND_INTERVAL:
            print(f"Detected {uuid} | RSSI: {rssi} - Sending update...")
            await send_data(session, uuid, rssi)
            last_sent[uuid] = now
        
        queue.task_done()

async def run_scanner():
    print(f"Starting CONTINUOUS BLE Scanner (Simulated ESP32: {ESP32_ID})...")
    print(f"Target Backend: {BACKEND_URL}")
    print("This will scan continuously without stopping.")
    
    async with aiohttp.ClientSession() as session:
        # Start the worker task that sends data
        asyncio.create_task(worker(session))
        
        # Start the scanner with the callback
        scanner = BleakScanner(detection_callback)
        await scanner.start()
        
        try:
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            print("Stopping scanner...")
        finally:
            await scanner.stop()

if __name__ == "__main__":
    try:
        asyncio.run(run_scanner())
    except KeyboardInterrupt:
        print("\nScanner stopped.")
    except Exception as e:
        print(f"\nError: {e}")
