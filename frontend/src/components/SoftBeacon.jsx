import React, { useState, useEffect, useRef } from 'react';
import { Bluetooth, MapPin, CheckCircle, XCircle, Loader, Wifi, HelpCircle } from 'lucide-react';
import api from '../services/api';
import CustomSelect from './CustomSelect';

/**
 * MobileVerify — Physical Presence Verification via BLE Connection
 * 
 * 1. User selects their classroom.
 * 2. Clicks "Verify with Room ESP32".
 * 3. Browser searches for that specific room's BLE signal.
 * 4. Once connected, the phone writes the Staff UUID to the ESP32's characteristic.
 * 5. This fulfills the requirement: "The signal is read by the ESP32".
 */
const MobileVerify = () => {
    const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
    const staffId = JSON.parse(localStorage.getItem('user') || '{}').staff_id?._id || 
                    JSON.parse(localStorage.getItem('user') || '{}').staff_id;
    const staffUuid = JSON.parse(localStorage.getItem('user') || '{}').staff_id?.beacon_uuid;

    const [classrooms, setClassrooms]     = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null); // The Classroom Object
    const [status, setStatus]             = useState(null); // { type, msg }
    const [isConnecting, setIsConnecting] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState(null);

    // GATT UUIDs (must match ESP32 firmware)
    const SERVICE_UUID        = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
    const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

    // Load available rooms
    useEffect(() => {
        api.get('/staff/classrooms')
            .then(res => setClassrooms(res.data))
            .catch(() => setStatus({ type: 'error', msg: 'Could not load classrooms.' }));
    }, []);

    const handleVerify = async () => {
        if (!selectedRoom) {
            setStatus({ type: 'error', msg: 'Please select your current classroom first.' });
            return;
        }

        if (!staffUuid) {
            setStatus({ type: 'error', msg: 'No Beacon UUID found for your account. Contact Admin.' });
            return;
        }

        if (!navigator.bluetooth) {
            setStatus({ type: 'error', msg: '❌ BLE not supported in this browser. Try Chrome on Android.' });
            return;
        }

        setIsConnecting(true);
        setStatus({ type: 'info', msg: `🔍 Scanning for ${selectedRoom.room_name}...` });

        try {
            // 1. Request the specific device based on the room's ESP32 ID
            // The ESP32 broadcasts its device name as the esp32_id (e.g. "ROOM_101")
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ name: selectedRoom.esp32_id }],
                optionalServices: [SERVICE_UUID]
            });

            setStatus({ type: 'info', msg: `📱 Connecting to ${selectedRoom.room_name} ESP32...` });

            // 2. Connect to the GATT Server
            const server = await device.gatt.connect();

            // 3. Get the characteristic
            const service = await server.getPrimaryService(SERVICE_UUID);
            const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

            // 4. WRITE the Staff UUID to the ESP32
            // This is the "Signal" that the ESP32 "Reads"
            const encoder = new TextEncoder();
            await characteristic.writeValue(encoder.encode(staffUuid));

            setStatus({ type: 'success', msg: `✅ Successfully verified! ESP32 has read your signal.` });
            
            // The ESP32 will now report to the backend via its own WiFi.
            // We'll wait 2 seconds and then refresh our status from the backend.
            setTimeout(async () => {
                const res = await api.get('/staff/my-attendance');
                if (res.data.length > 0) {
                    setAttendanceStatus(res.data[0].status);
                }
                setIsConnecting(false);
            }, 2000);

            // Optional: Disconnect to save battery on both sides
            await server.disconnect();

        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: `❌ Connection failed: ${err.message}` });
            setIsConnecting(false);
        }
    };

    return (
        <div style={{
            background: 'white',
            border: '2px solid #e2e8f0',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: '#f0f9ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Bluetooth size={20} color="#0ea5e9" />
                </div>
                <div>
                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#0f172a' }}>
                        Physical Presence Verification
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                        Connect to the room's hardware to mark attendance
                    </div>
                </div>
            </div>

            {/* Room Selector using Premium CustomSelect */}
            <div style={{ marginBottom: '24px' }}>
                <CustomSelect 
                    label="Select Your Classroom"
                    options={classrooms.map(room => ({ label: room.room_name, value: room._id }))}
                    value={selectedRoom?._id || ''}
                    onChange={(val) => {
                        const room = classrooms.find(r => r._id === val);
                        setSelectedRoom(room);
                    }}
                    placeholder="Choose your current room..."
                    required
                />
            </div>

            {/* Status Message */}
            {status && (
                <div style={{
                    padding: '12px 16px', borderRadius: '12px', fontSize: '13px',
                    fontWeight: '600', marginBottom: '20px',
                    background: status.type === 'success' ? '#f0fdf4' : status.type === 'error' ? '#fef2f2' : '#f0f9ff',
                    color: status.type === 'success' ? '#166534' : status.type === 'error' ? '#991b1b' : '#075985',
                    border: `1px solid ${status.type === 'success' ? '#bbf7d0' : status.type === 'error' ? '#fecaca' : '#bae6fd'}`
                }}>
                    {status.msg}
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleVerify}
                disabled={isConnecting}
                style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: isConnecting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s'
                }}
            >
                {isConnecting ? (
                    <><Loader className="spin" size={18} /> Connecting...</>
                ) : (
                    <><Wifi size={18} /> Verify with Room ESP32</>
                )}
            </button>

            {/* Attendance Status Display */}
            {attendanceStatus && (
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>Live Status:</span>
                    <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        background: attendanceStatus === 'Present' ? '#dcfce7' : attendanceStatus === 'Late' ? '#fef2f2' : '#fef3c7',
                        color: attendanceStatus === 'Present' ? '#166534' : attendanceStatus === 'Late' ? '#991b1b' : '#92400e'
                    }}>
                        {attendanceStatus}
                    </span>
                </div>
            )}

            <div style={{
                marginTop: '16px',
                fontSize: '11px',
                color: '#94a3b8',
                textAlign: 'center',
                lineHeight: '1.4'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                    <HelpCircle size={12} />
                    <strong>How it works:</strong>
                </div>
                Your phone will connect directly to the ESP32 on the wall.<br />
                The ESP32 reads your identity and reports your presence.
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MobileVerify;
