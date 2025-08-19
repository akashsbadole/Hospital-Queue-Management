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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const medicineId = params.id
    const medicineData = await request.json()
    
    const medicineIndex = mockMedicines.findIndex(m => m.id === medicineId)
    
    if (medicineIndex === -1) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }
    
    // Update medicine
    const updatedMedicine = {
      ...mockMedicines[medicineIndex],
      ...medicineData,
      quantity: parseInt(medicineData.quantity),
      price: parseFloat(medicineData.price)
    }
    
    // Update status based on quantity
    if (updatedMedicine.quantity === 0) {
      updatedMedicine.status = "out_of_stock"
    } else if (updatedMedicine.quantity < 50) {
      updatedMedicine.status = "low_stock"
    } else {
      updatedMedicine.status = "in_stock"
    }
    
    // Preserve new fields if not provided in update
    updatedMedicine.workingCondition = medicineData.workingCondition || mockMedicines[medicineIndex].workingCondition
    updatedMedicine.batchNumber = medicineData.batchNumber || mockMedicines[medicineIndex].batchNumber
    updatedMedicine.storageLocation = medicineData.storageLocation || mockMedicines[medicineIndex].storageLocation
    updatedMedicine.supplier = medicineData.supplier || mockMedicines[medicineIndex].supplier
    
    mockMedicines[medicineIndex] = updatedMedicine
    
    return NextResponse.json({ medicine: updatedMedicine })
  } catch (error) {
    console.error('Medicine update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const medicineId = params.id
    
    const medicineIndex = mockMedicines.findIndex(m => m.id === medicineId)
    
    if (medicineIndex === -1) {
      return NextResponse.json({ error: 'Medicine not found' }, { status: 404 })
    }
    
    mockMedicines.splice(medicineIndex, 1)
    
    return NextResponse.json({ message: 'Medicine deleted successfully' })
  } catch (error) {
    console.error('Medicine deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}