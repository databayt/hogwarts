# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Hogwarts seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please DO NOT:

- Open a public GitHub issue for the vulnerability
- Disclose the vulnerability publicly before it has been addressed
- Test vulnerabilities on production systems

### Please DO:

1. **Email us directly** at: security@databayt.org
2. Include the following information:
   - Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
   - Full paths of source file(s) related to the vulnerability
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue and how an attacker might exploit it

### What to Expect

- **Initial Response**: Within 48 hours, we will acknowledge receipt of your report
- **Assessment**: Within 7 days, we will assess the vulnerability and provide an estimated timeline
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days
- **Disclosure**: We will coordinate disclosure with you after the fix is released

### Safe Harbor

We consider security research conducted in accordance with this policy to be:

- Authorized in accordance with the Computer Fraud and Abuse Act (CFAA)
- Exempt from the Digital Millennium Copyright Act (DMCA)
- Exempt from restrictions in our Terms of Service that would interfere with security research

We will not pursue civil action or initiate a complaint against researchers who:

- Engage in testing within the scope of this policy
- Do not compromise user data or school tenant data
- Do not disrupt our services
- Report vulnerabilities promptly

### Recognition

We appreciate the security research community's efforts to help keep Hogwarts safe. While we currently don't have a formal bug bounty program, we will:

- Acknowledge your contribution in our release notes (with your permission)
- Add you to our security hall of fame (coming soon)

## Security Best Practices for Contributors

When contributing to Hogwarts, please ensure:

1. **Multi-tenant Safety**: Always include `schoolId` in database queries
2. **Input Validation**: Use Zod schemas for all user input
3. **Authentication**: Verify sessions in server actions
4. **No Secrets in Code**: Never commit API keys, passwords, or tokens
5. **Dependency Security**: Keep dependencies updated
6. **OWASP Top 10**: Be aware of common vulnerabilities

## Security Features

Hogwarts includes several security features:

- **NextAuth v5** with JWT strategy
- **Multi-tenant isolation** via schoolId scoping
- **CSRF protection** built into Next.js
- **Rate limiting** on authentication endpoints
- **Input sanitization** with Zod validation
- **SQL injection prevention** via Prisma ORM
- **XSS protection** via React's default escaping
- **Secure headers** configured in middleware

---

Thank you for helping keep Hogwarts and our users safe!
