import { CodeBlock } from '@/components/ui/code-block'

export function SubscriptionTables() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4">Subscription & Pricing Models</h3>
        <CodeBlock language="typescript" value={`
model SubscriptionTier {
  id                String   @id @default(cuid())
  name              String   // basic, premium, enterprise
  description       String
  monthlyPrice      Int     // Price in cents
  annualPrice       Int     // Price in cents
  maxStudents       Int
  maxTeachers       Int
  maxClasses        Int
  features          String[] // Array of feature identifiers
  isActive          Boolean  @default(true)
  
  // Relationships
  subscriptions     Subscription[]
  discounts         Discount[]
}

model Discount {
  id                String   @id @default(cuid())
  schoolId          String
  tierId            String
  code              String   @unique
  type              String   // percentage, fixed
  value             Int      // Percentage or fixed amount
  description       String
  validFrom         DateTime
  validUntil        DateTime
  maxUses           Int?
  currentUses       Int      @default(0)
  isActive          Boolean  @default(true)

  // Relationships
  school            School           @relation(fields: [schoolId], references: [id])
  subscriptionTier  SubscriptionTier @relation(fields: [tierId], references: [id])
  appliedDiscounts  AppliedDiscount[]
}

model AppliedDiscount {
  id          String   @id @default(cuid())
  schoolId    String
  discountId  String
  invoiceId   String
  amount      Int      // Amount saved in cents
  appliedAt   DateTime @default(now())

  // Relationships
  school      School   @relation(fields: [schoolId], references: [id])
  discount    Discount @relation(fields: [discountId], references: [id])
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
}`} />
      </div>

      <div>
        <h4 className="mb-2">Key Features</h4>
        <ul className="list-disc list-inside space-y-2 muted text-muted-foreground">
          <li>Tiered subscription plans with different limits and features</li>
          <li>Flexible discount system supporting both percentage and fixed amounts</li>
          <li>Usage tracking for limited-use discount codes</li>
          <li>Complete audit trail of applied discounts</li>
          <li>Multi-tenant safety with schoolId scoping</li>
        </ul>
      </div>

      <div>
        <h4 className="mb-2">Example Usage</h4>
        <CodeBlock language="typescript" value={`
// Create a new subscription tier
const tier = await prisma.subscriptionTier.create({
  data: {
    name: "premium",
    description: "Premium school plan",
    monthlyPrice: 19900, // $199.00
    annualPrice: 199900, // $1,999.00
    maxStudents: 500,
    maxTeachers: 50,
    maxClasses: 100,
    features: ["analytics", "api_access", "priority_support"]
  }
})

// Create a discount code
const discount = await prisma.discount.create({
  data: {
    schoolId: "school_123",
    tierId: tier.id,
    code: "WELCOME2024",
    type: "percentage",
    value: 20, // 20% off
    description: "New year promotion",
    validFrom: new Date(),
    validUntil: new Date("2024-12-31"),
    maxUses: 100
  }
})`} />
      </div>
    </div>
  )
}
