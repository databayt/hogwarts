# Security Scanner Skill

**Purpose**: OWASP Top 10 vulnerability detection, security best practices enforcement, and multi-tenant security validation

## Core Security Domains

### 1. OWASP Top 10 (2024) Coverage

#### A01: Broken Access Control
- **Detection**: Unauthorized data access patterns
- **Prevention**: Role-based access control (RBAC) verification
- **Multi-tenant**: schoolId scope validation in all queries
- **Hogwarts Context**: Verify teacher/student/admin role boundaries

#### A02: Cryptographic Failures
- **Detection**: Plain text passwords, weak encryption
- **Prevention**: bcrypt for passwords, TLS enforcement
- **Environment Variables**: Secure storage of secrets
- **Hogwarts Context**: Student/guardian data encryption

#### A03: Injection
- **SQL Injection**: Parameterized queries via Prisma
- **Command Injection**: Input sanitization
- **NoSQL Injection**: MongoDB query sanitization
- **Hogwarts Context**: Form inputs, search queries

#### A04: Insecure Design
- **Threat Modeling**: STRIDE analysis
- **Security Requirements**: Authentication, authorization
- **Defense in Depth**: Multiple security layers
- **Hogwarts Context**: Multi-tenant isolation design

#### A05: Security Misconfiguration
- **Headers**: CSP, HSTS, X-Frame-Options
- **CORS**: Proper origin configuration
- **Error Handling**: No stack traces in production
- **Hogwarts Context**: Subdomain security

#### A06: Vulnerable Components
- **Dependency Scanning**: npm audit, Snyk
- **Version Management**: Regular updates
- **License Compliance**: MIT compatibility
- **Hogwarts Context**: 200+ dependencies

#### A07: Authentication Failures
- **Session Management**: Secure JWT handling
- **Password Policy**: Minimum complexity
- **MFA Support**: Two-factor authentication
- **Hogwarts Context**: NextAuth v5 configuration

#### A08: Data Integrity Failures
- **Input Validation**: Zod schemas everywhere
- **Output Encoding**: XSS prevention
- **CSRF Protection**: Token validation
- **Hogwarts Context**: Server actions security

#### A09: Logging & Monitoring
- **Audit Logs**: User actions tracking
- **Error Monitoring**: Sentry integration
- **Security Events**: Failed login attempts
- **Hogwarts Context**: Multi-tenant audit trails

#### A10: Server-Side Request Forgery
- **URL Validation**: Whitelist allowed domains
- **Network Segmentation**: Internal service isolation
- **API Gateway**: Rate limiting, authentication
- **Hogwarts Context**: Webhook security

### 2. Multi-Tenant Security

#### Tenant Isolation
```typescript
// ❌ Vulnerable: Missing schoolId scope
const students = await db.student.findMany();

// ✅ Secure: Proper tenant isolation
const students = await db.student.findMany({
  where: { schoolId: session.user.schoolId }
});
```

#### Cross-Tenant Validation
- **Every Query**: Must include schoolId filter
- **Unique Constraints**: Scoped by tenant
- **Relationship Validation**: Prevent cross-tenant references
- **Session Verification**: schoolId in JWT claims

### 3. Authentication & Authorization

#### NextAuth v5 Security
- **JWT Security**: Signed tokens, short expiry
- **Session Validation**: Server-side verification
- **OAuth Security**: State parameter validation
- **Cookie Security**: httpOnly, secure, sameSite

#### Role-Based Access Control
```typescript
// Role hierarchy
DEVELOPER > ADMIN > TEACHER > ACCOUNTANT > STAFF > STUDENT > GUARDIAN > USER

// Permission matrix
const permissions = {
  ADMIN: ['*'],
  TEACHER: ['students.read', 'grades.write', 'attendance.write'],
  STUDENT: ['own.read', 'assignments.submit'],
  GUARDIAN: ['child.read', 'fees.pay']
};
```

### 4. Input Validation & Sanitization

#### Zod Schema Enforcement
```typescript
// Server-side validation (required)
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(5).max(100),
  schoolId: z.string().uuid()
});

// Double validation pattern
// 1. Client-side (UX)
// 2. Server-side (Security) - NEVER SKIP
```

#### XSS Prevention
- **React Default**: JSX escaping
- **dangerouslySetInnerHTML**: Avoid or sanitize
- **User Content**: DOMPurify for rich text
- **URL Validation**: Prevent javascript: URLs

### 5. Data Protection

#### Sensitive Data Handling
- **PII Classification**: Name, email, phone, address
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS only
- **Data Minimization**: Collect only necessary data

#### GDPR Compliance
- **Right to Access**: Data export functionality
- **Right to Deletion**: Soft delete with purge
- **Consent Management**: Explicit opt-ins
- **Data Retention**: Automatic expiration

## Security Checklist

### Pre-Deployment
- [ ] All inputs validated with Zod
- [ ] Multi-tenant queries include schoolId
- [ ] Sensitive data encrypted
- [ ] Security headers configured
- [ ] Dependencies updated (no critical CVEs)
- [ ] Error messages sanitized
- [ ] Rate limiting implemented
- [ ] CORS properly configured

### Code Review
- [ ] No hardcoded secrets
- [ ] No eval() or Function()
- [ ] No SQL string concatenation
- [ ] Proper error handling
- [ ] Secure random number generation
- [ ] File upload restrictions
- [ ] API authentication required

### Runtime Protection
- [ ] CSP headers active
- [ ] HTTPS enforced
- [ ] Session timeout configured
- [ ] Failed login tracking
- [ ] Audit logging enabled
- [ ] Monitoring alerts setup

## Vulnerability Patterns

### Common Anti-Patterns to Detect

```typescript
// ❌ SQL Injection Risk
db.$queryRaw(`SELECT * FROM users WHERE email = '${email}'`);

// ❌ XSS Risk
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ Path Traversal
fs.readFile(`./uploads/${req.body.filename}`);

// ❌ Command Injection
exec(`git clone ${userRepo}`);

// ❌ Insecure Randomness
Math.random() // for security tokens

// ❌ Missing Authorization
export async function deleteUser(id: string) {
  // No permission check!
  return db.user.delete({ where: { id } });
}
```

## Security Tools Integration

### Automated Scanning
```bash
# Dependency vulnerabilities
pnpm audit
npm audit fix

# SAST (Static Application Security Testing)
eslint-plugin-security
semgrep --config=auto

# Secrets detection
trufflehog filesystem .
gitleaks detect

# OWASP dependency check
dependency-check --project Hogwarts --scan .
```

### Manual Testing
- **Burp Suite**: Penetration testing
- **OWASP ZAP**: Vulnerability scanning
- **Postman**: API security testing
- **Chrome DevTools**: Client-side validation bypass

## Hogwarts-Specific Security

### Critical Areas
1. **Student Data**: FERPA compliance
2. **Financial Data**: PCI compliance for payments
3. **Health Records**: HIPAA considerations
4. **Exam System**: Academic integrity
5. **Multi-tenant**: Complete isolation

### Security Boundaries
```typescript
// Tenant boundary
middlewares/tenant-isolation.ts

// Authentication boundary
auth.config.ts

// Authorization boundary
lib/permissions.ts

// Data validation boundary
actions.ts ("use server")
```

## Incident Response

### Security Event Handling
1. **Detection**: Monitoring alerts
2. **Containment**: Isolate affected tenant
3. **Investigation**: Audit log analysis
4. **Remediation**: Patch vulnerability
5. **Recovery**: Restore service
6. **Lessons Learned**: Update security practices

## Usage

### When to Invoke
- Before deployments
- After adding new features
- During code reviews
- When handling sensitive data
- After dependency updates

### Example Commands
```bash
"Run security-scanner on the new payment module"
"Apply OWASP checklist to authentication flow"
"Verify multi-tenant isolation in exam system"
"Scan for XSS vulnerabilities in forms"
```

## References
- [OWASP Top 10 2024](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [NextAuth Security](https://authjs.dev/guides/security)