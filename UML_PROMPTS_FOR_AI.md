# UML Diagrams: Context-Aware Indoor Staff Presence Verification Using BLE

This document contains clear descriptions and **Mermaid.js code** for the four major UML diagrams required for your project. You can copy the code blocks below and paste them into any AI tool (like ChatGPT) or directly into [Mermaid Live Editor](https://mermaid.live/) to instantly generate beautiful, high-quality images for your Overleaf project.

---

## 1. Use Case Diagram
**Purpose**: Shows the interactions between the main users (Actors) and the system.
**Actors**: Admin, Staff, ESP32 Receiver (Hardware Actor).

### Academic Explanation for Report:
Figure 6.1 presents the Use Case Diagram showing the interactions between the Administrator, Staff, and hardware ESP32 nodes. The Administrator manages staff profiles and timetables, while the Staff Member broadcasts BLE identity signals. The ESP32 node acts as an automated gateway that scans proximate tags to trigger context-aware attendance logging or substitution alerts based on schedule matching.

### Description to tell the AI:
*"Create a Use Case diagram where the Admin can Add Staff, Assign Timetables, and View Reports. The Staff carries a BLE Tag. The ESP32 Receiver actively Scans the Tags and Forwards the Data constraint to the Backend System which Checks the Timetable and Marks Attendance. **Crucially, specify the arrow types:** use solid arrows (`-->`) for standard actor-to-use-case associations, and dotted arrows (`.->`) for includes/extends dependencies (e.g., between the BLE signal and detection)."*

### Mermaid Code:
```mermaid
usecaseDiagram
    actor Admin as "Administrator"
    actor Staff as "Staff (Carries BLE Tag)"
    actor ESP32 as "ESP32 BLE Receiver"

    package "Staff Presence Verification System" {
        usecase UC1 as "Manage Staff Profiles"
        usecase UC2 as "Configure Timetables"
        usecase UC3 as "View Live Dashboard"
        usecase UC4 as "Broadcast BLE Signal"
        usecase UC5 as "Scan Proximate Tags"
        usecase UC6 as "Context-Aware Verification"
        usecase UC7 as "Log Attendance"
        usecase UC8 as "Send Substitution Alert"
    }

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    
    Staff --> UC4
    
    ESP32 --> UC5
    UC4 .-> UC5 : "Detects Signal"
    
    UC5 --> UC6
    UC6 --> UC7 : "If Schedule Matches"
    UC6 --> UC8 : "If Conflict Found"
```

---

## 2. Class Diagram
**Purpose**: Represents the structure of the system through classes, their attributes, and relationships.

### Academic Explanation for Report:
Figure 6.2 illustrates the system structure and static relationships between the core entity classes. The diagram defines the associations between the `Admin`, `Staff`, `Classroom`, `Timetable`, and `Attendance` modules. Each `Staff` member is linked to multiple `Attendance` and `Timetable` records, while the `Classroom` class maps physical hardware IDs to scheduled academic sessions.

### Description to tell the AI:
*"Draw a Class Diagram for a Node.js/MongoDB backend. The main classes are Admin, Staff, Classroom, Timetable, and Attendance. Staff has a 1-to-Many relationship with Timetable and Attendance. Admin manages Staff and Timetables. **For the connections:** use solid association lines (`--`) without arrows to connect the classes, including cardinality labels like '1' and '*' at the ends of the lines."*

### Mermaid Code:
```mermaid
classDiagram
    class Admin {
        +String adminId
        +String password
        +login()
        +manageStaff()
        +assignTimetable()
        +viewReports()
    }

    class Staff {
        +ObjectId _id
        +String name
        +String beacon_uuid
        +String department
        +updateProfile()
        +getLiveStatus()
    }

    class Classroom {
        +ObjectId _id
        +String room_name
        +String esp32_id
    }

    class Timetable {
        +ObjectId staff_id
        +ObjectId classroom_id
        +String day_of_week
        +String start_time
        +String end_time
        +matchContext()
    }

    class Attendance {
        +ObjectId staff_id
        +ObjectId classroom_id
        +Date date
        +String status
        +Date check_in_time
        +markPresent()
    }

    Admin "1" -- "*" Staff : Manages
    Admin "1" -- "*" Timetable : Configures
    Staff "1" -- "*" Timetable : Has
    Staff "1" -- "*" Attendance : Logs
    Classroom "1" -- "*" Timetable : Hosted In
```

---

## 3. Sequence Diagram
**Purpose**: Shows the step-by-step time sequence of how a staff member walks into a room and gets marked present.

### Academic Explanation for Report:
Figure 6.3 details the sequence of events during a proximity-based BLE handshake. The process begins with the Staff Tag broadcasting a UUID, which is captured and filtered by the ESP32 node. The backend then performs a real-time database query to verify authorization; if the schedule matches, the presence is logged, and the status is pushed to the administrative dashboard.

### Description to tell the AI:
*"Generate a Sequence Diagram. Staff enters the room with a Tag. ESP32 detects the tag and sends HTTP POST to the Backend. Backend queries MongoDB for the Timetable. If scheduled, Backend writes Attendance. Dashboard fetches the update via API. **For the arrows:** use solid arrows with filled heads (`->>`) for synchronous requests/actions, and use dotted arrows with filled heads (`-->>`) for asynchronous responses or returning data."*

### Mermaid Code:
```mermaid
sequenceDiagram
    autonumber
    actor S as Staff (BLE Tag)
    participant E as ESP32 Classroom Node
    participant B as Node.js Backend
    participant DB as MongoDB (Timetable)
    participant D as React Dashboard

    S->>E: Broadcasts iBeacon UUID
    E->>E: Averages RSSI (Filter Noise)
    E->>B: HTTP POST JSON (UUID, RoomID, RSSI)
    
    B->>DB: Query: Is Staff Scheduled for RoomID NOW?
    
    alt Schedule Matches (Valid Context)
        DB-->>B: Returns True (Scheduled)
        B->>DB: Insert "Present" to Attendance Table
        B-->>E: 200 OK (Processed)
    else Schedule Mismatch (Or Free)
        DB-->>B: Returns False (Not Scheduled)
        B->>B: Ignore / Trigger Free Staff Alert
    end
    
    D->>B: GET /api/live-status
    B-->>D: Returns Updated Staff Status (Green)
```

---

## 4. Activity Diagram
**Purpose**: Shows the flow of execution from the system's start to the end.

### Academic Explanation for Report:
Figure 6.4 depicts the end-to-end logic flow for attendance verification. The activity starts with hardware scanning and RSSI threshold validation to ensure room-level precision. The system then branches into either marking "Present" for authorized staff or triggering "Substitution Alerts" for scheduled absences, ensuring continuous organizational accountability.

### Description to tell the AI:
*"Create an Activity flow chart. Start. ESP32 Scans BLE. Is RSSI stronger than threshold? If No, Ignore. If Yes, send to Server. Server checks Timetable. Does Schedule Match? If Yes, Mark Present. If No: Is Teacher Absent? If Yes, send Substitution Alert. End. **For the arrows:** use standard solid directional arrows (`-->`) for the main flow of execution, and use directional arrows with text properties (e.g., `-- Yes -->` or `-- No -->`) for decision branches."*

### Mermaid Code:
```mermaid
flowchart TD
    Start((Start)) --> scan[ESP32 Scans Classroom Environment]
    scan --> detect{Is BLE Tag \n Detected?}
    detect -- No --> scan
    detect -- Yes --> rssi{Is RSSI \n > -95dBm?}
    
    rssi -- No (Too Far) --> scan
    rssi -- Yes (Inside Room) --> send[Send UUID & RoomID to Backend]
    
    send --> dbQuery[Backend Queries DB for Timetable]
    
    dbQuery --> isScheduled{Is Staff \n Scheduled \n for Room?}
    
    isScheduled -- Yes --> mark[Mark Attendance: PRESENT]
    mark --> updateUI[Update Live Dashboard]
    updateUI --> End((End))
    
    isScheduled -- No --> checkLeave{Is Scheduled \n Teacher Absent?}
    checkLeave -- No --> ignore[Log as Free Staff]
    ignore --> End
    
    checkLeave -- Yes --> alert[Trigger Substitution Request Alert]
    alert --> End
```
