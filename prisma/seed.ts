import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample data generators
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Patricia', 'Charles']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']
const departments = ['General Medicine', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Gynecology', 'Dermatology', 'Ophthalmology', 'ENT', 'Psychiatry']
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']
const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh']
const medicines = [
  { name: 'Paracetamol', category: 'Analgesic', brand: 'Crocin', manufacturer: 'GSK', unitPrice: 10, sellingPrice: 15 },
  { name: 'Amoxicillin', category: 'Antibiotic', brand: 'Amoxil', manufacturer: 'Pfizer', unitPrice: 25, sellingPrice: 35 },
  { name: 'Ibuprofen', category: 'Analgesic', brand: 'Brufen', manufacturer: 'Abbott', unitPrice: 20, sellingPrice: 30 },
  { name: 'Omeprazole', category: 'Antacid', brand: 'Omez', manufacturer: 'Dr. Reddy', unitPrice: 15, sellingPrice: 22 },
  { name: 'Metformin', category: 'Antidiabetic', brand: 'Glycomet', manufacturer: 'USV', unitPrice: 30, sellingPrice: 45 },
  { name: 'Atorvastatin', category: 'Statin', brand: 'Lipitor', manufacturer: 'Pfizer', unitPrice: 40, sellingPrice: 60 },
  { name: 'Salbutamol', category: 'Bronchodilator', brand: 'Asthalin', manufacturer: 'Cipla', unitPrice: 35, sellingPrice: 50 },
  { name: 'Cetirizine', category: 'Antihistamine', brand: 'Zyrtec', manufacturer: 'UCB', unitPrice: 18, sellingPrice: 25 },
  { name: 'Pantoprazole', category: 'Antacid', brand: 'Pantocid', manufacturer: 'Sun Pharma', unitPrice: 22, sellingPrice: 32 },
  { name: 'Diclofenac', category: 'Analgesic', brand: 'Voveran', manufacturer: 'Novartis', unitPrice: 28, sellingPrice: 40 }
]

function getRandomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateAadhaarNumber() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString()
}

function generatePhoneNumber() {
  return '9' + Math.floor(100000000 + Math.random() * 900000000).toString()
}

function generateEmail(firstName: string, lastName: string, index: number) {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@example.com`
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Clearing existing data...')
  await prisma.receipt.deleteMany()
  await prisma.healthRecord.deleteMany()
  await prisma.prescription.deleteMany()
  await prisma.pharmacyQueue.deleteMany()
  await prisma.oPDQueue.deleteMany()
  await prisma.medicine.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  // Create Departments
  console.log('🏥 Creating departments...')
  const departmentData = departments.map(name => ({
    name,
    description: `${name} department for specialized medical care`
  }))
  const createdDepartments = await prisma.department.createMany({
    data: departmentData
  })
  console.log(`✅ Created ${createdDepartments.count} departments`)

  const allDepartments = await prisma.department.findMany()

  // Create Users
  console.log('👥 Creating users...')
  const users = []
  const userRoles = ['DOCTOR', 'NURSE', 'PHARMACIST', 'STAFF', 'ADMIN']
  
  for (let i = 0; i < 15; i++) {
    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)
    const role = getRandomElement(userRoles)
    const department = getRandomElement(allDepartments)
    
    const user = await prisma.user.create({
      data: {
        email: generateEmail(firstName, lastName, i + 100), // Use different index to avoid conflicts
        password: 'password123',
        name: `${firstName} ${lastName}`,
        role,
        department: department.name,
        isActive: true
      }
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // Create Patients
  console.log('👨‍⚕️ Creating patients...')
  const patients = []
  const castes = ['General', 'OBC', 'SC', 'ST', 'Other']
  const religions = ['HINDU', 'MUSLIM', 'CHRISTIAN', 'SIKH', 'BUDDHIST', 'JAIN', 'OTHER']
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  const maritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']
  
  for (let i = 0; i < 15; i++) {
    const firstName = getRandomElement(firstNames)
    const lastName = getRandomElement(lastNames)
    const age = getRandomNumber(18, 80)
    const gender = getRandomElement(['M', 'F', 'OTHER'])
    const hasBPLCard = Math.random() > 0.7
    const hasYellowCard = Math.random() > 0.8
    
    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        email: generateEmail(firstName, lastName, i),
        phone: generatePhoneNumber(),
        age,
        gender,
        dateOfBirth: getRandomDate(new Date(1940, 0, 1), new Date(2006, 0, 1)),
        bloodGroup: getRandomElement(bloodGroups),
        address: `${getRandomNumber(1, 999)} ${getRandomElement(['Main St', 'Park Ave', 'Church Rd', 'Market St'])}`,
        city: getRandomElement(cities),
        state: getRandomElement(states),
        country: 'India',
        postalCode: Math.floor(100000 + Math.random() * 900000).toString(),
        emergencyContact: getRandomElement(firstNames) + ' ' + getRandomElement(lastNames),
        emergencyPhone: generatePhoneNumber(),
        caste: getRandomElement(castes),
        religion: getRandomElement(religions),
        hasBPLCard,
        bplCardNumber: hasBPLCard ? 'BPL' + Math.floor(100000 + Math.random() * 900000) : null,
        hasYellowCard,
        yellowCardNumber: hasYellowCard ? 'YELLOW' + Math.floor(100000 + Math.random() * 900000) : null,
        aadhaarNumber: generateAadhaarNumber(),
        panNumber: hasBPLCard ? null : (Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()),
        nationality: 'Indian',
        maritalStatus: getRandomElement(maritalStatuses),
        occupation: getRandomElement(['Engineer', 'Teacher', 'Doctor', 'Business', 'Farmer', 'Student', 'Retired', 'Housewife']),
        annualIncome: getRandomElement(['< 1 Lakh', '1-3 Lakhs', '3-5 Lakhs', '5-10 Lakhs', '> 10 Lakhs']),
        education: getRandomElement(['High School', 'Graduate', 'Post Graduate', 'Professional'])
      }
    })
    patients.push(patient)
  }
  console.log(`✅ Created ${patients.length} patients`)

  // Create Medicines
  console.log('💊 Creating medicines...')
  const createdMedicines = []
  for (const medicine of medicines) {
    const expiryDate = getRandomDate(new Date(2024, 0, 1), new Date(2027, 0, 1))
    const createdMedicine = await prisma.medicine.create({
      data: {
        name: medicine.name,
        description: `${medicine.name} - ${medicine.category} medication`,
        category: medicine.category,
        brand: medicine.brand,
        manufacturer: medicine.manufacturer,
        batchNumber: 'BATCH' + Math.floor(1000 + Math.random() * 9000),
        expiryDate,
        quantity: getRandomNumber(50, 500),
        unitPrice: medicine.unitPrice,
        sellingPrice: medicine.sellingPrice,
        isActive: true
      }
    })
    createdMedicines.push(createdMedicine)
  }
  console.log(`✅ Created ${createdMedicines.length} medicines`)

  // Create OPD Queues
  console.log('🏥 Creating OPD queues...')
  const opdQueues = []
  const statuses = ['WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED']
  const priorities = ['NORMAL', 'URGENT', 'EMERGENCY']
  
  for (let i = 0; i < 15; i++) {
    const patient = getRandomElement(patients)
    const department = getRandomElement(allDepartments)
    const doctor = getRandomElement(users.filter(u => u.role === 'DOCTOR'))
    
    const opdQueue = await prisma.oPDQueue.create({
      data: {
        tokenNumber: getRandomNumber(100, 999),
        patientId: patient.id,
        departmentId: department.id,
        doctorId: doctor.id,
        status: getRandomElement(statuses),
        priority: getRandomElement(priorities),
        notes: `Patient visit for ${getRandomElement(['consultation', 'follow-up', 'routine checkup', 'emergency'])}`,
        calledAt: Math.random() > 0.5 ? getRandomDate(new Date(2024, 0, 1), new Date()) : null,
        servingAt: Math.random() > 0.7 ? getRandomDate(new Date(2024, 0, 1), new Date()) : null,
        completedAt: Math.random() > 0.8 ? getRandomDate(new Date(2024, 0, 1), new Date()) : null
      }
    })
    opdQueues.push(opdQueue)
  }
  console.log(`✅ Created ${opdQueues.length} OPD queue entries`)

  // Create Pharmacy Queues
  console.log('💊 Creating pharmacy queues...')
  const pharmacyQueues = []
  
  for (let i = 0; i < 15; i++) {
    const patient = getRandomElement(patients)
    const department = getRandomElement(allDepartments) // Just use any department for pharmacy queue
    
    const pharmacyQueue = await prisma.pharmacyQueue.create({
      data: {
        tokenNumber: 'PH' + getRandomNumber(100, 999),
        patientId: patient.id,
        departmentId: department.id,
        status: getRandomElement(statuses),
        priority: getRandomElement(priorities),
        notes: `Pharmacy visit for ${getRandomElement(['medicine collection', 'prescription refill', 'consultation'])}`,
        calledAt: Math.random() > 0.5 ? getRandomDate(new Date(2024, 0, 1), new Date()) : null,
        servingAt: Math.random() > 0.7 ? getRandomDate(new Date(2024, 0, 1), new Date()) : null,
        completedAt: Math.random() > 0.8 ? getRandomDate(new Date(2024, 0, 1), new Date()) : null
      }
    })
    pharmacyQueues.push(pharmacyQueue)
  }
  console.log(`✅ Created ${pharmacyQueues.length} pharmacy queue entries`)

  // Create Health Records
  console.log('📋 Creating health records...')
  const healthRecords = []
  const diagnoses = ['Fever', 'Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Migraine', 'Gastritis', 'Anemia', 'Thyroid', 'Depression']
  const symptoms = ['Headache', 'Body pain', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Dizziness', 'Chest pain', 'Shortness of breath']
  const treatments = ['Rest', 'Medication', 'Therapy', 'Surgery', 'Lifestyle changes', 'Diet modification']
  
  for (let i = 0; i < 15; i++) {
    const patient = getRandomElement(patients)
    const doctor = getRandomElement(users.filter(u => u.role === 'DOCTOR'))
    
    const healthRecord = await prisma.healthRecord.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        diagnosis: getRandomElement(diagnoses),
        symptoms: getRandomElement(symptoms) + ', ' + getRandomElement(symptoms),
        treatment: getRandomElement(treatments),
        prescription: 'Prescribed medication as per diagnosis',
        notes: 'Patient advised to follow up after 2 weeks',
        visitDate: getRandomDate(new Date(2024, 0, 1), new Date()),
        followUpDate: Math.random() > 0.3 ? getRandomDate(new Date(), new Date(2025, 0, 1)) : null
      }
    })
    healthRecords.push(healthRecord)
  }
  console.log(`✅ Created ${healthRecords.length} health records`)

  // Create Prescriptions
  console.log('📝 Creating prescriptions...')
  const prescriptions = []
  
  for (let i = 0; i < 15; i++) {
    const patient = getRandomElement(patients)
    const doctor = getRandomElement(users.filter(u => u.role === 'DOCTOR'))
    const selectedMedicines = createdMedicines.slice(0, getRandomNumber(1, 3))
    
    const medications = selectedMedicines.map(med => ({
      name: med.name,
      dosage: getRandomElement(['1-0-1', '1-1-1', '0-0-1', '1-0-0']),
      duration: getRandomNumber(3, 14) + ' days',
      instructions: 'Take after food'
    }))
    
    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        diagnosis: getRandomElement(diagnoses),
        medications: JSON.stringify(medications),
        notes: 'Take as prescribed. Complete the full course.',
        issuedDate: getRandomDate(new Date(2024, 0, 1), new Date())
      }
    })
    prescriptions.push(prescription)
  }
  console.log(`✅ Created ${prescriptions.length} prescriptions`)

  // Create Receipts
  console.log('💰 Creating receipts...')
  const receipts = []
  const receiptTypes = ['CONSULTATION', 'MEDICINE', 'LAB_TEST', 'OTHER']
  const paymentMethods = ['CASH', 'CARD', 'UPI', 'INSURANCE']
  
  for (let i = 0; i < 15; i++) {
    const patient = getRandomElement(patients)
    const user = getRandomElement(users)
    
    const receipt = await prisma.receipt.create({
      data: {
        patientId: patient.id,
        userId: user.id,
        receiptNumber: 'REC' + Date.now() + Math.floor(Math.random() * 1000),
        type: getRandomElement(receiptTypes),
        amount: getRandomNumber(100, 5000),
        description: `Payment for ${getRandomElement(['consultation', 'medicines', 'lab tests', 'procedures'])}`,
        items: JSON.stringify([
          { name: getRandomElement(['Consultation Fee', 'Medicine Cost', 'Test Fee']), quantity: 1, price: getRandomNumber(100, 2000) }
        ]),
        status: getRandomElement(['PAID', 'PENDING', 'CANCELLED']),
        paymentMethod: getRandomElement(paymentMethods)
      }
    })
    receipts.push(receipt)
  }
  console.log(`✅ Created ${receipts.length} receipts`)

  console.log('🎉 Database seeding completed successfully!')
  console.log('📊 Summary:')
  console.log(`   - Departments: ${allDepartments.length}`)
  console.log(`   - Users: ${users.length}`)
  console.log(`   - Patients: ${patients.length}`)
  console.log(`   - Medicines: ${createdMedicines.length}`)
  console.log(`   - OPD Queues: ${opdQueues.length}`)
  console.log(`   - Pharmacy Queues: ${pharmacyQueues.length}`)
  console.log(`   - Health Records: ${healthRecords.length}`)
  console.log(`   - Prescriptions: ${prescriptions.length}`)
  console.log(`   - Receipts: ${receipts.length}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Error during seeding:', e)
  process.exit(1)
})