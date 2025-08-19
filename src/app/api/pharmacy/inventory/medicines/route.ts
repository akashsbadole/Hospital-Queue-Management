import { NextResponse } from 'next/server'

const mockMedicines = [
  {
    id: "1",
    name: "Paracetamol",
    category: "Pain Killers",
    quantity: 500,
    unit: "tablets",
    price: 5.99,
    expiryDate: "2025-12-31",
    manufacturer: "PharmaCorp",
    description: "Pain relief medication",
    status: "in_stock",
    workingCondition: "good",
    batchNumber: "PC001",
    storageLocation: "A1-01",
    supplier: "PharmaCorp Ltd"
  },
  {
    id: "2",
    name: "Amoxicillin",
    category: "Antibiotics",
    quantity: 20,
    unit: "capsules",
    price: 12.50,
    expiryDate: "2024-06-30",
    manufacturer: "MediLab",
    description: "Antibiotic medication",
    status: "low_stock",
    workingCondition: "good",
    batchNumber: "ML002",
    storageLocation: "B2-05",
    supplier: "MediLab Inc"
  },
  {
    id: "3",
    name: "Vitamin C",
    category: "Vitamins",
    quantity: 0,
    unit: "tablets",
    price: 8.99,
    expiryDate: "2024-12-31",
    manufacturer: "HealthPlus",
    description: "Vitamin C supplement",
    status: "out_of_stock",
    workingCondition: "expired",
    batchNumber: "HP003",
    storageLocation: "C3-02",
    supplier: "HealthPlus Co"
  },
  {
    id: "4",
    name: "Ibuprofen",
    category: "Pain Killers",
    quantity: 200,
    unit: "tablets",
    price: 7.99,
    expiryDate: "2025-08-15",
    manufacturer: "PharmaCorp",
    description: "Anti-inflammatory medication",
    status: "in_stock",
    workingCondition: "good",
    batchNumber: "PC004",
    storageLocation: "A1-03",
    supplier: "PharmaCorp Ltd"
  },
  {
    id: "5",
    name: "Lisinopril",
    category: "Cardiovascular",
    quantity: 15,
    unit: "mg",
    price: 15.99,
    expiryDate: "2024-09-30",
    manufacturer: "CardioCare",
    description: "Blood pressure medication",
    status: "low_stock",
    workingCondition: "damaged",
    batchNumber: "CC005",
    storageLocation: "D4-01",
    supplier: "CardioCare Systems"
  }
]

export async function GET() {
  try {
    return NextResponse.json({ medicines: mockMedicines })
  } catch (error) {
    console.error('Medicines fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const medicineData = await request.json()
    
    // Create new medicine with mock ID
    const newMedicine = {
      id: (mockMedicines.length + 1).toString(),
      ...medicineData,
      quantity: parseInt(medicineData.quantity),
      price: parseFloat(medicineData.price)
    }
    
    // Determine status based on quantity
    if (newMedicine.quantity === 0) {
      newMedicine.status = "out_of_stock"
    } else if (newMedicine.quantity < 50) {
      newMedicine.status = "low_stock"
    } else {
      newMedicine.status = "in_stock"
    }
    
    // Set default values for new fields if not provided
    newMedicine.workingCondition = medicineData.workingCondition || "good"
    newMedicine.batchNumber = medicineData.batchNumber || ""
    newMedicine.storageLocation = medicineData.storageLocation || ""
    newMedicine.supplier = medicineData.supplier || ""
    
    mockMedicines.push(newMedicine)
    
    return NextResponse.json({ medicine: newMedicine }, { status: 201 })
  } catch (error) {
    console.error('Medicine creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}