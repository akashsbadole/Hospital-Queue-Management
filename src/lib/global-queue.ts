// Global queue data that persists across API calls
declare global {
  var globalQueueItems: any[] | undefined;
}

// Initialize global queue data if it doesn't exist
if (!global.globalQueueItems) {
  global.globalQueueItems = [
    {
      id: "1",
      patientName: "John Smith",
      patientId: "P001",
      tokenNumber: "A001",
      department: "General Medicine",
      status: "WAITING",
      priority: "NORMAL",
      estimatedWaitTime: 15,
      joinedAt: "2024-01-15T09:00:00Z",
      calledAt: null,
      completedAt: null
    },
    {
      id: "2",
      patientName: "Mary Johnson",
      patientId: "P002",
      tokenNumber: "A002",
      department: "General Medicine",
      status: "CALLED",
      priority: "NORMAL",
      estimatedWaitTime: 0,
      joinedAt: "2024-01-15T09:15:00Z",
      calledAt: "2024-01-15T10:30:00Z",
      completedAt: null
    },
    {
      id: "3",
      patientName: "Robert Davis",
      patientId: "P003",
      tokenNumber: "B001",
      department: "Cardiology",
      status: "WAITING",
      priority: "URGENT",
      estimatedWaitTime: 10,
      joinedAt: "2024-01-15T09:30:00Z",
      calledAt: null,
      completedAt: null
    },
    {
      id: "4",
      patientName: "Sarah Wilson",
      patientId: "P004",
      tokenNumber: "C001",
      department: "Pediatrics",
      status: "SERVING",
      priority: "NORMAL",
      estimatedWaitTime: 0,
      joinedAt: "2024-01-15T09:45:00Z",
      calledAt: "2024-01-15T10:15:00Z",
      completedAt: null
    },
    {
      id: "5",
      patientName: "Michael Brown",
      patientId: "P005",
      tokenNumber: "D001",
      department: "Orthopedics",
      status: "COMPLETED",
      priority: "NORMAL",
      estimatedWaitTime: 0,
      joinedAt: "2024-01-15T08:30:00Z",
      calledAt: "2024-01-15T09:00:00Z",
      completedAt: "2024-01-15T09:45:00Z"
    }
  ];
}

export const globalQueueItems = global.globalQueueItems;

export const departmentMap = {
  "1": "General Medicine",
  "2": "Cardiology",
  "3": "Pediatrics",
  "4": "Orthopedics",
  "5": "Dermatology",
  "6": "Gynecology",
  "7": "Ophthalmology",
  "8": "ENT"
};

export const getDepartmentNameById = (id: string) => {
  return departmentMap[id as keyof typeof departmentMap] || "";
};