# License Enforcement Playbook

This document outlines the process for handling violations of the SSPL-1.0 license or trademark policy.

## Types of Violations

### 1. SaaS Violation (Highest Priority)

Someone offers Hogwarts (or a derivative) as a hosted service without a commercial license and without releasing their full service source code under SSPL.

**Indicators:**

- Hosted school management platform using Hogwarts code
- Hogwarts UI, features, or architecture visible in their product
- No public repository with their complete service source code under SSPL

### 2. Trademark Violation

Someone uses "Hogwarts," "databayt," or confusingly similar marks without permission.

**Indicators:**

- Product or service using our name/branding
- Domain names containing our marks
- App store listings using our marks

### 3. License Removal

Someone strips the SSPL license headers or LICENSE file from a fork.

**Indicators:**

- Fork without LICENSE file
- Source files with copyright headers removed
- No attribution or license reference

## Response Process

### Step 1: Document the Violation (Day 1)

- [ ] Screenshot the offending product/repository
- [ ] Archive the page using web.archive.org
- [ ] Document which code or marks are being used
- [ ] Identify the operator (WHOIS, GitHub profile, company info)
- [ ] Save all evidence with timestamps

### Step 2: Good-Faith Contact (Day 1-3)

Send a polite, professional email:

- Identify the specific violation
- Reference the SSPL-1.0 license and/or trademark policy
- Offer the commercial license as a resolution path
- Set a 14-day deadline to resolve
- CC legal@databayt.org for records

### Step 3: Escalation (Day 14-21)

If no response or no resolution:

**For GitHub-hosted forks:**

- File a DMCA takedown via https://github.com/contact/dmca-takedown
- Reference the SSPL-1.0 license and specific files

**For other platforms:**

- File abuse reports with the hosting provider
- Major providers: Vercel, AWS, GCP, Azure, DigitalOcean, Hetzner
- Reference copyright infringement (DMCA for US-based hosts)

**For app stores:**

- Apple App Store: Report via https://www.apple.com/legal/contact/
- Google Play: Report via developer console

**For domain names:**

- File UDRP complaint for domains using our marks
- Contact the registrar's abuse team

### Step 4: Legal Action (Day 30+)

If all other avenues fail:

- Engage legal counsel
- Send formal cease-and-desist letter
- Consider filing in appropriate jurisdiction
- SSPL is based on AGPL, which has strong legal precedent

## DMCA Takedown Template

When filing a DMCA takedown, include:

1. Identification of the copyrighted work (Hogwarts platform, SSPL-1.0 licensed)
2. Identification of the infringing material (URLs, repository links)
3. Contact information (legal@databayt.org)
4. Good-faith statement that the use is not authorized
5. Statement under penalty of perjury that the information is accurate
6. Physical or electronic signature

## Prevention Measures

These are already in place to deter violations:

- [x] SSPL-1.0 LICENSE file in repository root
- [x] Copyright headers in all 3,750+ source files
- [x] NOTICE file with third-party attributions
- [x] LICENSING.md explaining dual-licensing
- [x] TRADEMARKS.md with brand usage policy
- [x] CLA in CONTRIBUTING.md
- [x] CODEOWNERS protecting license files

## Monitoring

Periodically check for violations:

- GitHub code search: `"databayt" OR "hogwarts school automation"` in external repos
- Google alerts for "hogwarts school management" and "databayt"
- App store searches for similar products
- Domain monitoring for "hogwarts" + "school" + "saas" combinations

## Contact

All enforcement matters: **legal@databayt.org**
Commercial licensing inquiries: **licensing@databayt.org**
