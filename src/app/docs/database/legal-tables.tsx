import { CodeBlock } from '@/components/ui/code-block'

export function LegalTables() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Legal & Compliance Models</h3>
        <CodeBlock language="typescript" value={`
model LegalConsent {
  id                String   @id @default(cuid())
  schoolId          String
  userId            String
  documentType      String   // terms, privacy, data-processing
  documentVersion   String   // Version consented to
  consentType       String   // explicit, implicit, parental
  ipAddress         String?
  userAgent         String?
  consentedAt       DateTime @default(now())
  revokedAt         DateTime?
  metadata          Json?

  // Relationships
  school            School   @relation(fields: [schoolId], references: [id])
  user              User     @relation(fields: [userId], references: [id])

  @@unique([schoolId, userId, documentType, documentVersion])
}

model LegalDocument {
  id                String   @id @default(cuid())
  schoolId          String
  type              String   // terms, privacy, data-processing
  version           String   // Semantic version
  content           String   @db.Text
  effectiveFrom     DateTime
  effectiveUntil    DateTime?
  isActive          Boolean  @default(true)
  requiresExplicit  Boolean  @default(true)
  metadata          Json?

  // Relationships
  school            School   @relation(fields: [schoolId], references: [id])
}

model ComplianceLog {
  id                String   @id @default(cuid())
  schoolId          String
  eventType         String   // consent events, document updates
  eventData         Json
  userId            String?
  timestamp         DateTime @default(now())
  metadata          Json?

  // Relationships
  school            School   @relation(fields: [schoolId], references: [id])
  user              User?    @relation(fields: [userId], references: [id])
}`} />
      </div>

      <div>
        <h4 className="font-medium mb-2">Key Features</h4>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>Comprehensive consent tracking with version control</li>
          <li>Support for multiple document types and consent types</li>
          <li>Audit trail with detailed event logging</li>
          <li>GDPR-compliant consent evidence collection</li>
          <li>Multi-tenant safety with schoolId scoping</li>
        </ul>
      </div>

      <div>
        <h4 className="font-medium mb-2">Example Usage</h4>
        <CodeBlock language="typescript" value={`
// Record user consent
const consent = await prisma.legalConsent.create({
  data: {
    schoolId: "school_123",
    userId: "user_456",
    documentType: "terms",
    documentVersion: "1.0.0",
    consentType: "explicit",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    metadata: {
      source: "onboarding",
      platform: "web"
    }
  }
})

// Log compliance event
await prisma.complianceLog.create({
  data: {
    schoolId: "school_123",
    eventType: "consent-given",
    eventData: {
      documentType: "terms",
      version: "1.0.0",
      consentId: consent.id
    },
    userId: "user_456"
  }
})`} />
      </div>
    </div>
  )
}
