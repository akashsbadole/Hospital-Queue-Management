import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding chatbot knowledge base...')

  const knowledgeBase = [
    {
      category: 'GENERAL',
      question: 'What are the hospital visiting hours?',
      answer: 'Our hospital visiting hours are:\n• General Ward: 10:00 AM - 12:00 PM and 4:00 PM - 6:00 PM\n• ICU: 11:00 AM - 12:00 PM and 5:00 PM - 6:00 PM\n• Emergency: 24/7 access for immediate family members\n\nPlease note that visiting hours may be restricted during outbreaks or for patient safety.',
      keywords: JSON.stringify(['visiting', 'hours', 'timing', 'visit', 'family']),
      priority: 10
    },
    {
      category: 'QUEUE',
      question: 'How do I check my queue status?',
      answer: 'You can check your queue status in several ways:\n1. Visit our queue display screen in the hospital lobby\n2. Check the online queue display at /queue-display\n3. Ask at the reception desk\n4. Use our mobile app (if available)\n\nYour token number will be displayed along with the current serving number and estimated wait time.',
      keywords: JSON.stringify(['queue', 'status', 'token', 'wait', 'check']),
      priority: 15
    },
    {
      category: 'QUEUE',
      question: 'How long is the waiting time?',
      answer: 'Waiting times vary by department and time of day:\n• General OPD: 30-60 minutes\n• Emergency: Immediate to 30 minutes (triage based)\n• Pharmacy: 15-45 minutes\n• Laboratory: 30-90 minutes\n\nFor the most accurate wait time, please check the queue display or ask at the reception.',
      keywords: JSON.stringify(['waiting', 'time', 'long', 'duration', 'wait']),
      priority: 12
    },
    {
      category: 'PHARMACY',
      question: 'How do I get my prescription filled?',
      answer: 'To get your prescription filled:\n1. Get your prescription from the doctor\n2. Proceed to the pharmacy counter\n3. Submit your prescription and get a queue token\n4. Wait for your token to be called\n5. Pay for your medicines at the billing counter\n6. Collect your medicines from the pharmacy\n\nPlease bring a valid ID and ensure your prescription is complete.',
      keywords: JSON.stringify(['prescription', 'pharmacy', 'medicine', 'fill', 'dispense']),
      priority: 14
    },
    {
      category: 'BILLING',
      question: 'What payment methods do you accept?',
      answer: 'We accept the following payment methods:\n• Cash\n• Credit/Debit Cards (Visa, Mastercard, RuPay)\n• Mobile Payments (UPI, PayTM, PhonePe)\n• Insurance (tie-ups with major providers)\n• Corporate billing (for registered companies)\n\nPlease check with the billing counter for specific insurance coverage.',
      keywords: JSON.stringify(['payment', 'billing', 'pay', 'money', 'card', 'cash']),
      priority: 8
    },
    {
      category: 'MEDICAL',
      question: 'Do I need an appointment?',
      answer: 'Appointments are recommended but not always required:\n• Appointments: Preferred for specialists and to reduce waiting time\n• Walk-ins: Accepted for general OPD and emergency cases\n• Emergency: No appointment needed, available 24/7\n\nTo book an appointment, call our reception or use our online booking system.',
      keywords: JSON.stringify(['appointment', 'book', 'schedule', 'walk-in', 'emergency']),
      priority: 11
    },
    {
      category: 'TECHNICAL',
      question: 'I forgot my password. How do I reset it?',
      answer: 'To reset your password:\n1. Go to the login page\n2. Click on "Forgot Password"\n3. Enter your registered email address\n4. Check your email for reset instructions\n5. Follow the link to create a new password\n\nIf you don\'t receive the email within 10 minutes, please check your spam folder or contact IT support.',
      keywords: JSON.stringify(['password', 'reset', 'forgot', 'login', 'account']),
      priority: 9
    },
    {
      category: 'GENERAL',
      question: 'Where is the hospital located?',
      answer: 'Our hospital is located at:\n123 Healthcare Avenue\nMedical District, City - 123456\n\nLandmarks: Near City General Hospital, opposite Central Park\n\nParking: Free parking available for patients and visitors\nPublic Transport: Bus stop at hospital entrance, Metro station 500m away',
      keywords: JSON.stringify(['location', 'address', 'where', 'directions', 'map']),
      priority: 7
    },
    {
      category: 'EMERGENCY',
      question: 'What should I do in an emergency?',
      answer: 'In case of emergency:\n1. Call our emergency helpline: 108 or 911\n2. Come directly to the Emergency Department (24/7)\n3. Bring identification and any relevant medical records\n4. Inform the triage nurse about the emergency\n\nFor life-threatening emergencies, call an ambulance or go to the nearest emergency room immediately.',
      keywords: JSON.stringify(['emergency', 'urgent', 'helpline', 'ambulance', 'life-threatening']),
      priority: 20
    },
    {
      category: 'PHARMACY',
      question: 'Can I get medicines delivered?',
      answer: 'Yes, we offer medicine delivery services:\n• Home delivery available for registered patients\n• Delivery within 24 hours in city limits\n• Additional delivery charges may apply\n• Prescription must be from our hospital doctors\n\nTo request delivery, call the pharmacy counter after your prescription is filled.',
      keywords: JSON.stringify(['delivery', 'home', 'medicine', 'deliver', 'shipping']),
      priority: 6
    }
  ]

  for (const knowledge of knowledgeBase) {
    await prisma.chatbotKnowledge.create({
      data: knowledge
    })
  }

  console.log('Chatbot knowledge base seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })