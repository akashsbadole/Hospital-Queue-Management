import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding new data for maintenance mode, hospital settings, staff notices...')

  // Create default hospital settings
  const hospitalSettings = await prisma.hospitalSetting.create({
    data: {
      hospitalName: 'City General Hospital',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      address: '123 Hospital Road, Medical District',
      phone: '+1-555-0123',
      email: 'info@citygeneralhospital.com',
      website: 'https://citygeneralhospital.com'
    }
  })

  console.log('Created hospital settings:', hospitalSettings.hospitalName)

  // Create default maintenance mode (disabled)
  const maintenanceMode = await prisma.maintenanceMode.create({
    data: {
      isEnabled: false,
      message: 'System is under maintenance. Please check back later.'
    }
  })

  console.log('Created maintenance mode setting')

  // Create some staff notices
  const notices = [
    {
      title: 'System Update Tonight',
      content: 'The hospital management system will be updated tonight from 10 PM to 2 AM. Please plan accordingly.',
      type: 'INFO',
      targetRole: 'ALL',
      priority: 3
    },
    {
      title: 'New Doctor Onboarded',
      content: 'Dr. Sarah Johnson has joined our Cardiology department. Welcome her to the team!',
      type: 'ANNOUNCEMENT',
      targetRole: 'ALL',
      priority: 2
    },
    {
      title: 'Emergency Protocol Update',
      content: 'Updated emergency response protocols are now available. All staff must review by Friday.',
      type: 'URGENT',
      targetRole: 'DOCTOR',
      priority: 5
    },
    {
      title: 'Pharmacy Stock Alert',
      content: 'Low stock on common antibiotics. Please prescribe alternatives when possible.',
      type: 'WARNING',
      targetRole: 'PHARMACIST',
      priority: 4
    }
  ]

  for (const notice of notices) {
    await prisma.staffNotice.create({
      data: notice
    })
  }

  console.log('Created staff notices:', notices.length)

  console.log('New data seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })