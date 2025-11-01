// Invoice seed data for testing and development
// This file provides comprehensive test data for the invoice module

import { PrismaClient } from '@prisma/client'
import { InvoiceStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate invoice numbers
function generateInvoiceNumber(index: number): string {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(index).padStart(5, '0')}`
}

// Helper function to calculate dates
function getDateOffset(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

export async function seedInvoices(userId: string, schoolId: string) {
  console.log('🧾 Seeding invoice data...')

  try {
    // Create invoice settings for the user
    const invoiceSettings = await prisma.userInvoiceSettings.create({
      data: {
        userId,
        schoolId,
        invoiceLogo: 'https://placehold.co/200x80/png?text=School+Logo',
      }
    })

    // Create signature for settings
    await prisma.userInvoiceSignature.create({
      data: {
        name: 'John Smith',
        image: 'https://placehold.co/150x50/png?text=Signature',
        settingsId: invoiceSettings.id,
        schoolId
      }
    })

    // Sample client addresses
    const clientAddresses = [
      {
        name: 'ABC Corporation',
        email: 'billing@abccorp.com',
        address1: '123 Business Ave',
        address2: 'Suite 100',
        address3: 'New York, NY 10001'
      },
      {
        name: 'XYZ Industries',
        email: 'accounts@xyzindustries.com',
        address1: '456 Industrial Park',
        address2: 'Building B',
        address3: 'Los Angeles, CA 90001'
      },
      {
        name: 'Tech Solutions Inc',
        email: 'finance@techsolutions.com',
        address1: '789 Innovation Drive',
        address2: null,
        address3: 'San Francisco, CA 94105'
      },
      {
        name: 'Global Services Ltd',
        email: 'payments@globalservices.com',
        address1: '321 Commerce Street',
        address2: 'Floor 5',
        address3: 'Chicago, IL 60601'
      },
      {
        name: 'Digital Marketing Agency',
        email: 'billing@digitalagency.com',
        address1: '555 Creative Blvd',
        address2: null,
        address3: 'Austin, TX 78701'
      }
    ]

    // School address (from address for all invoices)
    const schoolAddress = await prisma.userInvoiceAddress.create({
      data: {
        name: 'Hogwarts School',
        email: 'billing@hogwarts.edu',
        address1: '1 Castle Road',
        address2: 'Administration Building',
        address3: 'Scotland, UK',
        schoolId
      }
    })

    // Invoice templates with different statuses and dates
    const invoiceTemplates = [
      // Recent paid invoices
      {
        status: InvoiceStatus.PAID,
        invoice_date: getDateOffset(-45),
        due_date: getDateOffset(-15),
        items: [
          { item_name: 'Annual Tuition Fee', quantity: 1, price: 12000 },
          { item_name: 'Library Fee', quantity: 1, price: 500 },
          { item_name: 'Lab Fee', quantity: 1, price: 800 }
        ],
        discount: 500,
        tax_percentage: 10,
        notes: 'Thank you for your prompt payment. Payment received on time.'
      },
      {
        status: InvoiceStatus.PAID,
        invoice_date: getDateOffset(-30),
        due_date: getDateOffset(-10),
        items: [
          { item_name: 'Sports Activities Fee', quantity: 1, price: 600 },
          { item_name: 'Uniform Set', quantity: 3, price: 150 },
          { item_name: 'Books and Materials', quantity: 1, price: 450 }
        ],
        discount: 0,
        tax_percentage: 8,
        notes: 'Payment confirmed. Receipt sent via email.'
      },
      // Current unpaid invoices
      {
        status: InvoiceStatus.UNPAID,
        invoice_date: getDateOffset(-10),
        due_date: getDateOffset(20),
        items: [
          { item_name: 'Semester Tuition', quantity: 1, price: 6000 },
          { item_name: 'Accommodation Fee', quantity: 1, price: 2000 },
          { item_name: 'Meal Plan', quantity: 1, price: 1500 }
        ],
        discount: 200,
        tax_percentage: 10,
        notes: 'Please make payment before the due date to avoid late fees.'
      },
      {
        status: InvoiceStatus.UNPAID,
        invoice_date: getDateOffset(-5),
        due_date: getDateOffset(25),
        items: [
          { item_name: 'Extra-Curricular Activities', quantity: 1, price: 400 },
          { item_name: 'Field Trip Fee', quantity: 1, price: 200 },
          { item_name: 'Art Supplies', quantity: 1, price: 150 }
        ],
        discount: 0,
        tax_percentage: 5,
        notes: 'Multiple payment methods available. Contact finance office for assistance.'
      },
      // Overdue invoices
      {
        status: InvoiceStatus.OVERDUE,
        invoice_date: getDateOffset(-60),
        due_date: getDateOffset(-30),
        items: [
          { item_name: 'Previous Term Balance', quantity: 1, price: 3000 },
          { item_name: 'Late Registration Fee', quantity: 1, price: 100 }
        ],
        discount: 0,
        tax_percentage: 10,
        notes: 'URGENT: This invoice is overdue. Please contact the finance office immediately.'
      },
      {
        status: InvoiceStatus.OVERDUE,
        invoice_date: getDateOffset(-40),
        due_date: getDateOffset(-10),
        items: [
          { item_name: 'Transportation Fee', quantity: 1, price: 800 },
          { item_name: 'Technology Fee', quantity: 1, price: 300 }
        ],
        discount: 0,
        tax_percentage: 8,
        notes: 'Second notice: Payment is overdue. Late fees may apply.'
      },
      // Cancelled invoice
      {
        status: InvoiceStatus.CANCELLED,
        invoice_date: getDateOffset(-20),
        due_date: getDateOffset(10),
        items: [
          { item_name: 'Optional Summer Program', quantity: 1, price: 2500 },
          { item_name: 'Summer Camp Activities', quantity: 1, price: 500 }
        ],
        discount: 100,
        tax_percentage: 10,
        notes: 'Invoice cancelled per student withdrawal from program.'
      },
      // More unpaid current invoices
      {
        status: InvoiceStatus.UNPAID,
        invoice_date: getDateOffset(-3),
        due_date: getDateOffset(27),
        items: [
          { item_name: 'Science Lab Equipment', quantity: 1, price: 250 },
          { item_name: 'Computer Lab Access', quantity: 1, price: 200 },
          { item_name: 'Workshop Materials', quantity: 1, price: 180 }
        ],
        discount: 30,
        tax_percentage: 7,
        notes: 'Early payment discount available if paid within 10 days.'
      },
      {
        status: InvoiceStatus.UNPAID,
        invoice_date: getDateOffset(-7),
        due_date: getDateOffset(23),
        items: [
          { item_name: 'Music Lessons', quantity: 10, price: 50 },
          { item_name: 'Instrument Rental', quantity: 1, price: 150 }
        ],
        discount: 0,
        tax_percentage: 5,
        notes: 'Payment plan available upon request.'
      },
      // More paid invoices with varying amounts
      {
        status: InvoiceStatus.PAID,
        invoice_date: getDateOffset(-50),
        due_date: getDateOffset(-20),
        items: [
          { item_name: 'Annual Registration', quantity: 1, price: 500 },
          { item_name: 'Student ID Card', quantity: 1, price: 25 },
          { item_name: 'Parking Permit', quantity: 1, price: 200 }
        ],
        discount: 25,
        tax_percentage: 8,
        notes: 'Payment received. Thank you for your business.'
      },
      {
        status: InvoiceStatus.PAID,
        invoice_date: getDateOffset(-35),
        due_date: getDateOffset(-5),
        items: [
          { item_name: 'Examination Fees', quantity: 1, price: 300 },
          { item_name: 'Certificate Processing', quantity: 1, price: 50 },
          { item_name: 'Transcript Request', quantity: 2, price: 25 }
        ],
        discount: 0,
        tax_percentage: 5,
        notes: 'All fees paid in full.'
      },
      {
        status: InvoiceStatus.UNPAID,
        invoice_date: getDateOffset(-2),
        due_date: getDateOffset(28),
        items: [
          { item_name: 'Graduation Ceremony Fee', quantity: 1, price: 150 },
          { item_name: 'Cap and Gown Rental', quantity: 1, price: 75 },
          { item_name: 'Yearbook', quantity: 1, price: 60 }
        ],
        discount: 10,
        tax_percentage: 7,
        notes: 'Final invoice for graduating students.'
      },
      // Large unpaid invoice
      {
        status: InvoiceStatus.UNPAID,
        invoice_date: getDateOffset(-1),
        due_date: getDateOffset(30),
        items: [
          { item_name: 'Full Year Tuition', quantity: 1, price: 24000 },
          { item_name: 'Full Board Accommodation', quantity: 1, price: 8000 },
          { item_name: 'Premium Meal Plan', quantity: 1, price: 3000 },
          { item_name: 'Insurance Fee', quantity: 1, price: 1200 }
        ],
        discount: 2000,
        tax_percentage: 12,
        notes: 'Annual payment due. 5% discount available for early payment.'
      },
      {
        status: InvoiceStatus.OVERDUE,
        invoice_date: getDateOffset(-45),
        due_date: getDateOffset(-15),
        items: [
          { item_name: 'Special Education Support', quantity: 1, price: 1500 },
          { item_name: 'Therapy Sessions', quantity: 5, price: 200 }
        ],
        discount: 0,
        tax_percentage: 0,
        notes: 'Please settle this overdue amount to avoid service interruption.'
      },
      // Small paid invoices
      {
        status: InvoiceStatus.PAID,
        invoice_date: getDateOffset(-25),
        due_date: getDateOffset(5),
        items: [
          { item_name: 'Lost Library Book', quantity: 1, price: 45 },
          { item_name: 'Replacement ID Card', quantity: 1, price: 15 }
        ],
        discount: 0,
        tax_percentage: 5,
        notes: 'Replacement fees paid.'
      }
    ]

    // Create invoices
    let invoiceCount = 1
    const createdInvoices = []

    for (const template of invoiceTemplates) {
      // Select a random client (cycling through them)
      const clientData = clientAddresses[invoiceCount % clientAddresses.length]

      // Create client address
      const clientAddress = await prisma.userInvoiceAddress.create({
        data: {
          ...clientData,
          schoolId
        }
      })

      // Calculate totals
      const subTotal = template.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      const discountAmount = template.discount || 0
      const taxAmount = template.tax_percentage ? (subTotal - discountAmount) * (template.tax_percentage / 100) : 0
      const total = subTotal - discountAmount + taxAmount

      // Create invoice
      const invoice = await prisma.userInvoice.create({
        data: {
          invoice_no: generateInvoiceNumber(invoiceCount),
          invoice_date: template.invoice_date,
          due_date: template.due_date,
          currency: 'USD',
          fromAddressId: schoolAddress.id,
          toAddressId: clientAddress.id,
          sub_total: subTotal,
          discount: discountAmount,
          tax_percentage: template.tax_percentage,
          total: total,
          notes: template.notes,
          status: template.status,
          userId,
          schoolId,
          items: {
            create: template.items.map(item => ({
              ...item,
              total: item.quantity * item.price,
              schoolId
            }))
          }
        },
        include: {
          items: true
        }
      })

      createdInvoices.push(invoice)
      invoiceCount++

      console.log(`  ✓ Created invoice ${invoice.invoice_no} - ${template.status} - $${total.toFixed(2)}`)
    }

    console.log(`✅ Successfully seeded ${createdInvoices.length} invoices`)

    return {
      invoices: createdInvoices,
      settings: invoiceSettings,
      schoolAddress
    }
  } catch (error) {
    console.error('❌ Error seeding invoice data:', error)
    throw error
  }
}

// Standalone execution
export async function main() {
  try {
    // You need to provide a valid userId and schoolId
    // These should come from your existing user and school data
    const userId = process.env.SEED_USER_ID || 'test-user-id'
    const schoolId = process.env.SEED_SCHOOL_ID || 'test-school-id'

    if (!userId || !schoolId) {
      throw new Error('Please provide SEED_USER_ID and SEED_SCHOOL_ID environment variables')
    }

    await seedInvoices(userId, schoolId)
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}