# 🔐 Authentication Production Readiness Checklist

**Last Updated:** 2025-01-14
**Current Status:** 75% Production-Ready
**Estimated Time to Production:** 3-4 weeks

---

## 📊 Overview & Current Status

### Security Score by Category

| Category | Score | Status |
|----------|-------|--------|
| CSRF Protection | 95% | ✅ Excellent |
| XSS Prevention | 100% | ✅ Excellent |
| SQL Injection | 100% | ✅ Excellent (Prisma ORM) |
| Password Security | 60% | ⚠️ Weak policy (6 chars) |
| Session Security | 85% | ✅ Good (JWT, httpOnly) |
| Rate Limiting | 20% | 🔴 Infrastructure exists, not applied |
| OAuth Security | 50% | 🔴 PKCE disabled |
| Cookie Security | 95% | ✅ Excellent |
| Multi-Tenant Isolation | 90% | ✅ Strong (needs audit) |
| Test Coverage | 0% | 🔴 Critical gap |

**Overall Security Rating: 67/100 (C+)**

### Strengths ✅

- ✅ Well-structured NextAuth v5 implementation
- ✅ Excellent multi-tenant isolation with `schoolId` scoping
- ✅ Comprehensive auth flows (login, register, reset, 2FA, verification)
- ✅ Proper cookie security (httpOnly, secure, sameSite)
- ✅ CSRF protection via NextAuth
- ✅ SQL injection prevention via Prisma ORM
- ✅ OAuth integration (Google, Facebook)
- ✅ Email sending infrastructure (Resend API)

### Critical Issues 🔴

- 🔴 PKCE disabled for OAuth providers (`auth.config.ts:42`)
- 🔴 No rate limiting on auth endpoints
- 🔴 Zero test coverage
- 🔴 Weak password policy (only 6 characters)
- 🔴 No account lockout mechanism
- 🔴 100+ console.log statements in production code
- 🔴 Email verification not enforced

---

## 🔴 Critical Fixes Required (Week 1)

**Must complete before ANY production deployment**

### 1. Re-enable PKCE for OAuth
- [ ] **File:** `src/auth.config.ts:42-43`
- [ ] Remove `checks: []` from Google provider
- [ ] Remove `checks: []` from Facebook provider
- [ ] **Why:** Prevents authorization code interception attacks
- [ ] **Time:** 30 minutes
- [ ] **Test:** Verify OAuth flow still works after change

**Code Fix:**
```typescript
// BEFORE (INSECURE):
Google({
  // ...
  checks: [], // Disable PKCE temporarily
})

// AFTER (SECURE):
Google({
  // ...
  // checks: ["pkce", "state"], // Default - re-enable by removing checks: []
})
```

### 2. Apply Rate Limiting to Auth Endpoints
- [ ] **Files to update:**
  - [ ] `src/components/auth/login/action.ts`
  - [ ] `src/components/auth/join/action.ts`
  - [ ] `src/components/auth/reset/action.ts`
  - [ ] `src/components/auth/password/action.ts`
  - [ ] `src/components/auth/verification/action.ts`
- [ ] **Why:** Prevents brute force attacks, credential stuffing
- [ ] **Time:** 2 hours
- [ ] **Use existing:** `src/lib/rate-limit.ts` (already configured)

**Implementation Example:**
```typescript
// src/components/auth/login/action.ts
import { rateLimit } from "@/lib/rate-limit"

export async function login(values: LoginFormData) {
  // Add rate limiting FIRST
  const identifier = values.email; // Use email as identifier
  const rateLimitResult = await rateLimit(identifier, "AUTH");

  if (!rateLimitResult.success) {
    return {
      error: "Too many login attempts. Please try again later."
    };
  }

  // Continue with existing login logic...
}
```

### 3. Strengthen Password Policy
- [ ] **File:** `src/components/auth/validation.ts`
- [ ] Update password schema to require:
  - [ ] Minimum 12 characters (currently 6)
  - [ ] At least one uppercase letter
  - [ ] At least one lowercase letter
  - [ ] At least one number
  - [ ] At least one special character
- [ ] **Why:** Prevents weak passwords, brute force attacks
- [ ] **Time:** 4 hours (includes UI updates)

**Code Fix:**
```typescript
// src/components/auth/validation.ts
export const PasswordSchema = z.object({
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
```

### 4. Implement Account Lockout
- [ ] **New file:** `src/lib/account-lockout.ts`
- [ ] Track failed login attempts in database
- [ ] Lock account after 5 failed attempts
- [ ] Lockout duration: 15 minutes
- [ ] Send email notification on lockout
- [ ] **Why:** Prevents unlimited brute force attempts
- [ ] **Time:** 4 hours

**Schema Update:**
```prisma
// prisma/models/user.prisma
model User {
  // ... existing fields
  failedLoginAttempts Int      @default(0)
  lockedUntil         DateTime?
}
```

### 5. Remove Production console.log
- [ ] **Files:** All auth-related files
- [ ] Replace `console.log` with conditional logging
- [ ] Use proper logger (Winston/Pino) or environment check
- [ ] Keep development logging, remove production
- [ ] **Why:** Performance impact, security (log poisoning)
- [ ] **Time:** 2 hours

**Pattern:**
```typescript
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  console.log('[AUTH-DEBUG]', data);
}
```

### 6. Add Basic Test Suite
- [ ] Unit tests for validation schemas
- [ ] Unit tests for token generation
- [ ] Integration test for login action
- [ ] Integration test for registration action
- [ ] E2E test for login flow
- [ ] **Why:** Zero test coverage is unacceptable for production
- [ ] **Time:** 16 hours
- [ ] **Goal:** 50%+ coverage minimum before deployment

---

## 🟠 High Priority Items (Week 2-3)

**Complete before public launch**

### 1. Enforce Email Verification
- [ ] **File:** `src/components/auth/login/action.ts:33-44`
- [ ] Block login if `emailVerified` is null
- [ ] Show clear error message
- [ ] Provide "Resend verification" link
- [ ] **Current behavior:** Sends another email but allows login
- [ ] **Time:** 2 hours

### 2. Implement Session Management UI
- [ ] Create `/settings/sessions` page
- [ ] List all active sessions (requires DB schema update)
- [ ] Show: device, location, last active, IP
- [ ] "Revoke session" button
- [ ] "Logout all devices" button
- [ ] **Time:** 12 hours

### 3. Add Security Event Logging
- [ ] Log failed login attempts
- [ ] Log successful logins
- [ ] Log password changes
- [ ] Log email changes
- [ ] Log 2FA enrollment/disable
- [ ] Log OAuth connections
- [ ] Store in database with retention policy
- [ ] **Time:** 8 hours

### 4. Set Up Error Monitoring
- [ ] Integrate Sentry for auth errors
- [ ] Add error boundaries for auth components
- [ ] Track OAuth failures
- [ ] Alert on suspicious patterns
- [ ] **Time:** 4 hours

### 5. Add Account Recovery Mechanisms
- [ ] Backup email field on User model
- [ ] 2FA recovery codes (10 single-use codes)
- [ ] "Trusted device" mechanism
- [ ] Account recovery flow
- [ ] **Time:** 12 hours

---

## 🔵 OAuth with Facebook Checklist

### Prerequisites
- [ ] Facebook App created at https://developers.facebook.com
- [ ] App ID and App Secret obtained
- [ ] App in "Production" mode (not Development)

### Configuration Verification

#### 1. Facebook App Settings
- [ ] **App Domains:** `databayt.org`
- [ ] **Privacy Policy URL:** Set
- [ ] **Terms of Service URL:** Set
- [ ] **App Icon:** Uploaded (required for production)

#### 2. OAuth Redirect URIs
- [ ] **Production:** `https://ed.databayt.org/api/auth/callback/facebook`
- [ ] **Preview:** Add Vercel preview domains to allowed list
- [ ] **Development:** `http://localhost:3000/api/auth/callback/facebook`
- [ ] **Location:** Facebook App → Products → Facebook Login → Settings → Valid OAuth Redirect URIs

#### 3. Environment Variables
- [ ] `FACEBOOK_CLIENT_ID` set in `.env`
- [ ] `FACEBOOK_CLIENT_SECRET` set in `.env`
- [ ] Variables validated in `src/env.mjs`
- [ ] **Verify:** Run `pnpm dev` and check console for auth config

#### 4. Permissions & Scopes
- [ ] **File:** `src/auth.config.ts:48-52`
- [ ] Email scope requested
- [ ] Public profile scope (default)
- [ ] No excessive permissions requested

#### 5. Profile Mapping
- [ ] **File:** `src/auth.config.ts:54-62`
- [ ] Verify profile ID extraction
- [ ] Verify email extraction (with fallback)
- [ ] Verify name extraction
- [ ] Verify profile picture URL handling
- [ ] Email verification auto-set

#### 6. Hash Cleanup
- [ ] **File:** `src/components/auth/social.tsx:110-145`
- [ ] Facebook `#_=_` hash removed from callback URLs
- [ ] Verified not breaking redirect logic

#### 7. Error Handling
- [ ] **File:** `src/app/[lang]/(auth)/error/page.tsx`
- [ ] OAuthAccountNotLinked error handled
- [ ] OAuthCallback error handled
- [ ] Generic OAuth errors shown clearly

#### 8. Account Linking
- [ ] **Scenario:** User exists with email via credentials
- [ ] **Scenario:** User exists with same email via Google
- [ ] **Behavior:** Accounts automatically linked by email
- [ ] **Prisma:** Account table stores provider connections

#### 9. Multi-Tenant Support
- [ ] OAuth callback preserves `schoolId` context
- [ ] Redirect to correct subdomain after OAuth
- [ ] Smart subdomain redirect logic in `src/auth.ts:874-978`

### Testing Steps

- [ ] **Test 1:** New user registration via Facebook
  - Click "Continue with Facebook"
  - Authorize app
  - Verify redirect to correct subdomain
  - Verify user created in database
  - Verify Account record created with provider="facebook"

- [ ] **Test 2:** Existing user login via Facebook
  - User already registered with email
  - Click "Continue with Facebook"
  - Verify account linking (no duplicate user)
  - Verify successful login

- [ ] **Test 3:** Facebook without email permission
  - Deny email permission during OAuth
  - Verify fallback email (`{facebook_id}@facebook.com`)
  - Verify user still created

- [ ] **Test 4:** Multi-tenant OAuth
  - Access subdomain: `school1.localhost:3000`
  - Login with Facebook
  - Verify redirect back to `school1.localhost:3000`
  - Verify session includes correct `schoolId`

- [ ] **Test 5:** Error scenarios
  - User cancels OAuth
  - Network timeout during OAuth
  - Invalid redirect URI error
  - Verify error page shown with clear message

### Known Issues
- [ ] **Resolved:** Facebook 500 error (was hash cleanup issue)
- [ ] **Check:** `src/components/auth/ISSUE.md:54-64` for updates

### Security Checklist
- [ ] ⚠️ **CRITICAL:** PKCE disabled - MUST re-enable before production
- [ ] State parameter validated on callback
- [ ] OAuth tokens stored securely (not exposed to client)
- [ ] No client-side secrets
- [ ] HTTPS enforced in production

---

## 🔵 OAuth with Google Checklist

### Prerequisites
- [ ] Google Cloud Project created
- [ ] OAuth 2.0 credentials configured
- [ ] OAuth consent screen completed

### Configuration Verification

#### 1. Google Cloud Console Setup
- [ ] **Project:** Created at https://console.cloud.google.com
- [ ] **APIs & Services → Credentials**
- [ ] OAuth 2.0 Client ID created (Web application)
- [ ] Client ID and Client Secret obtained

#### 2. OAuth Consent Screen
- [ ] User Type: External (for public access) or Internal (for organization)
- [ ] App name: "Hogwarts School Platform"
- [ ] User support email set
- [ ] Developer contact email set
- [ ] App logo uploaded (optional but recommended)
- [ ] Scopes: `email`, `profile`, `openid` (default)
- [ ] **Status:** Publishing status set to "In Production"

#### 3. Authorized Redirect URIs
- [ ] **Production:** `https://ed.databayt.org/api/auth/callback/google`
- [ ] **Subdomains:** `https://*.databayt.org/api/auth/callback/google`
- [ ] **Development:** `http://localhost:3000/api/auth/callback/google`
- [ ] **Preview:** Vercel preview URLs (if needed)
- [ ] **Location:** Credentials → OAuth 2.0 Client IDs → Edit → Authorized redirect URIs

#### 4. Environment Variables
- [ ] `GOOGLE_CLIENT_ID` set in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` set in `.env`
- [ ] Variables validated in `src/env.mjs`
- [ ] **Verify:** Check console output on `pnpm dev`

#### 5. Provider Configuration
- [ ] **File:** `src/auth.config.ts:23-42`
- [ ] Client ID configured
- [ ] Client Secret configured
- [ ] Authorization params:
  - [ ] `prompt: "consent"` (re-consent each time)
  - [ ] `access_type: "offline"` (get refresh token)
  - [ ] `response_type: "code"` (authorization code flow)

#### 6. Profile Mapping
- [ ] **File:** `src/auth.config.ts:33-41`
- [ ] `id` mapped from `profile.sub`
- [ ] `username` mapped from `profile.name`
- [ ] `email` mapped from `profile.email`
- [ ] `image` mapped from `profile.picture`
- [ ] `emailVerified` auto-set to current date

#### 7. Token Storage
- [ ] Access token stored in Account table
- [ ] Refresh token stored (for offline access)
- [ ] Token expiry tracked
- [ ] **Note:** Refresh logic not yet implemented (future enhancement)

#### 8. Error Handling
- [ ] **File:** `src/app/[lang]/(auth)/error/page.tsx`
- [ ] `redirect_uri_mismatch` error handled
- [ ] Account linking errors handled
- [ ] Generic OAuth errors shown clearly

#### 9. Multi-Tenant Support
- [ ] OAuth callback preserves subdomain context
- [ ] Redirect to correct school subdomain after login
- [ ] Session includes correct `schoolId`
- [ ] Smart redirect logic in `src/auth.ts:874-978`

### Testing Steps

- [ ] **Test 1:** New user registration via Google
  - Navigate to login page
  - Click "Continue with Google"
  - Select Google account
  - Grant permissions
  - Verify redirect to dashboard
  - Verify user created in database
  - Verify Account record with provider="google"

- [ ] **Test 2:** Existing user login via Google
  - User already exists with same email
  - Login with Google
  - Verify account linking (no duplicate user)
  - Verify successful authentication

- [ ] **Test 3:** Multi-tenant OAuth
  - Access: `school1.localhost:3000/login`
  - Login with Google
  - Verify redirect to `school1.localhost:3000/dashboard`
  - Verify session contains correct `schoolId`

- [ ] **Test 4:** Offline access
  - Complete OAuth flow
  - Check database: Account table
  - Verify `refresh_token` is stored
  - Verify `expires_at` timestamp set

- [ ] **Test 5:** Re-consent flow
  - Login with Google (already authorized)
  - Verify consent screen shown again (due to `prompt: "consent"`)
  - Complete login

- [ ] **Test 6:** Error scenarios
  - Use invalid redirect URI (trigger error)
  - Verify error page with helpful message
  - Cancel during Google consent screen
  - Verify graceful error handling

### Known Issues
- [ ] **From ISSUE.md:** `redirect_uri_mismatch` error (lines 47-53)
  - **Cause:** Redirect URI in Google Console doesn't match actual callback
  - **Fix:** Ensure exact match including protocol (http vs https)
- [ ] **Check:** Verify no new issues in `src/components/auth/ISSUE.md`

### Security Checklist
- [ ] ⚠️ **CRITICAL:** PKCE disabled (`checks: []`) - MUST re-enable
- [ ] State parameter validated
- [ ] Tokens stored securely server-side only
- [ ] No client secrets exposed
- [ ] HTTPS enforced in production
- [ ] Refresh tokens rotated (future: implement rotation logic)

---

## 🔵 Credentials (Email/Password) Checklist

### Registration Flow

#### 1. Form Validation
- [ ] **File:** `src/components/auth/validation.ts`
- [ ] **Schema:** `RegisterSchema`
- [ ] Email format validation
- [ ] Password strength validation
- [ ] Confirm password matching
- [ ] Name validation (optional)
- [ ] Client-side validation via `react-hook-form`

#### 2. Server Action
- [ ] **File:** `src/components/auth/join/action.ts`
- [ ] ✅ Server-side validation (re-validate with Zod)
- [ ] ⚠️ **Missing:** Rate limiting - ADD THIS
- [ ] Duplicate email check
- [ ] Multi-tenant duplicate check (`email + schoolId` unique)
- [ ] Password hashing with bcrypt (10 rounds)
- [ ] User creation in database

#### 3. Password Security
- [ ] **Current:** 6 character minimum ⚠️ **TOO WEAK**
- [ ] **Required:** 12+ characters with complexity
- [ ] Hashing algorithm: bcrypt ✅
- [ ] Salt rounds: 10 ✅
- [ ] No plaintext storage ✅
- [ ] **File to update:** `src/components/auth/validation.ts`

#### 4. Email Uniqueness
- [ ] **Schema:** `prisma/models/user.prisma`
- [ ] Constraint: `@@unique([email, schoolId])` ✅
- [ ] Allows same email across different schools ✅
- [ ] Prevents duplicates within same school ✅
- [ ] **Action:** `src/components/auth/join/action.ts:27-32`

#### 5. Initial Email Verification
- [ ] Verification token generated after registration
- [ ] **Function:** `generateVerificationToken()` in `src/components/auth/tokens.ts`
- [ ] Verification email sent via Resend API
- [ ] **Function:** `sendVerificationEmail()` in `src/lib/mail.ts`
- [ ] User created with `emailVerified: null`
- [ ] ⚠️ **Issue:** Login allowed before verification - SHOULD BLOCK

#### 6. Multi-Tenant Context
- [ ] Registration captures `schoolId` from context
- [ ] **Function:** `getTenantContext()` in `src/lib/tenant-context.ts`
- [ ] Sources: subdomain header → session → impersonation cookie
- [ ] User assigned to correct school
- [ ] ⚠️ **Verify:** Cross-tenant registration prevention

### Login Flow

#### 1. Form Validation
- [ ] **File:** `src/components/auth/validation.ts`
- [ ] **Schema:** `LoginSchema`
- [ ] Email format validation
- [ ] Password presence check
- [ ] Optional 2FA code field

#### 2. Server Action
- [ ] **File:** `src/components/auth/login/action.ts`
- [ ] ✅ Server-side validation
- [ ] ⚠️ **Missing:** Rate limiting - ADD THIS
- [ ] ⚠️ **Missing:** Account lockout - ADD THIS
- [ ] User lookup by email
- [ ] Multi-tenant email lookup (email + schoolId)
- [ ] Password comparison with bcrypt

#### 3. Authentication Flow
- [ ] Credentials validated
- [ ] 2FA check if enabled for user
- [ ] If 2FA enabled: redirect to 2FA page
- [ ] If 2FA disabled: create session
- [ ] Session created via NextAuth `signIn()`
- [ ] Redirect to callback URL or dashboard

#### 4. Email Verification Check
- [ ] **File:** `src/components/auth/login/action.ts:33-44`
- [ ] ⚠️ **Current behavior:** Sends email but allows login
- [ ] ❌ **Should block login** if email not verified
- [ ] Show error: "Please verify your email first"
- [ ] Provide resend verification link

#### 5. Failed Login Handling
- [ ] ❌ **Missing:** Failed attempt tracking
- [ ] ❌ **Missing:** Account lockout after 5 attempts
- [ ] ❌ **Missing:** Lockout notification email
- [ ] Generic error message (don't reveal if email exists)
- [ ] Log failed attempts for security monitoring

#### 6. Subdomain Redirect
- [ ] After successful login, redirect based on user role
- [ ] Platform admins (DEVELOPER): main domain
- [ ] Regular users: school subdomain
- [ ] **Logic:** `src/components/auth/login/action.ts:107-156`
- [ ] Uses `getSchoolDomain()` and `constructSchoolUrl()`

### Testing Steps

#### Registration Tests
- [ ] **Test 1:** Valid registration
  - Fill form with valid data
  - Submit
  - Verify user created in database
  - Verify password hashed (not plaintext)
  - Verify verification email sent
  - Verify `emailVerified` is null

- [ ] **Test 2:** Duplicate email in same school
  - Register user with email
  - Try to register again with same email + same school
  - Verify error: "Email already registered"

- [ ] **Test 3:** Same email in different school
  - Register user in school1
  - Register user with same email in school2
  - Verify both accounts created successfully
  - Verify different `schoolId` values

- [ ] **Test 4:** Weak password rejection
  - Try password < 6 characters (currently: should fail)
  - Try password with no uppercase (currently: should pass ⚠️)
  - After fix: verify complexity requirements enforced

- [ ] **Test 5:** Password confirmation mismatch
  - Enter different passwords
  - Verify error: "Passwords do not match"

#### Login Tests
- [ ] **Test 6:** Valid credentials login
  - Enter correct email and password
  - Verify successful login
  - Verify redirect to dashboard
  - Verify session created

- [ ] **Test 7:** Invalid password
  - Enter correct email, wrong password
  - Verify error: "Invalid credentials"
  - Verify no specific indication if email exists

- [ ] **Test 8:** Non-existent email
  - Enter email that doesn't exist
  - Verify error: "Invalid credentials" (same as wrong password)

- [ ] **Test 9:** Login before email verification
  - Register new account
  - Try to login before verifying email
  - ⚠️ **Current:** Allowed (sends another email)
  - **After fix:** Should block with clear message

- [ ] **Test 10:** Multi-tenant login
  - User exists in school1
  - Login from `school1.localhost:3000`
  - Verify successful login to school1
  - Try to login from `school2.localhost:3000`
  - Verify failure (user doesn't exist in school2)

- [ ] **Test 11:** Account lockout (after implementation)
  - Enter wrong password 5 times
  - Verify account locked
  - Verify error: "Account locked for 15 minutes"
  - Verify lockout email sent
  - Wait 15 minutes or manually unlock
  - Verify login works again

- [ ] **Test 12:** Rate limiting (after implementation)
  - Make 6 rapid login attempts
  - Verify rate limit error on 6th attempt
  - Wait 1 minute
  - Verify login allowed again

### Security Checklist
- [ ] ⚠️ **Fix:** Strengthen password policy (6 → 12+ chars)
- [ ] ⚠️ **Add:** Rate limiting on login action
- [ ] ⚠️ **Add:** Account lockout mechanism
- [ ] ⚠️ **Fix:** Block login until email verified
- [ ] ✅ Passwords hashed with bcrypt
- [ ] ✅ No plaintext passwords in database
- [ ] ✅ Generic error messages (no email enumeration)
- [ ] ✅ Multi-tenant email uniqueness enforced
- [ ] ⚠️ **Add:** Security event logging (login attempts)

---

## 🔵 Email Verification Checklist

### Token Generation

#### 1. Token Creation
- [ ] **File:** `src/components/auth/tokens.ts:3-27`
- [ ] **Function:** `generateVerificationToken(email: string)`
- [ ] Token format: UUID v4
- [ ] Expiration: 1 hour from generation
- [ ] Stored in `VerificationToken` table
- [ ] Old tokens deleted before creating new one

#### 2. Token Storage
- [ ] **Schema:** `prisma/models/verification-token.prisma`
- [ ] Fields: `id`, `email`, `token`, `expires`
- [ ] Unique constraint on `email`
- [ ] No compound unique constraint (allows multiple tokens)
- [ ] ⚠️ **Note:** Old tokens deleted manually, not by DB

#### 3. Token Security
- [ ] ✅ UUID v4 provides sufficient randomness (128-bit)
- [ ] ✅ HTTPS ensures token not intercepted in transit
- [ ] ✅ Token in URL (not ideal, but standard practice)
- [ ] ⚠️ Consider: Token expiry notification (15 min before expiry)

### Email Sending

#### 1. Email Service Configuration
- [ ] **Service:** Resend API
- [ ] **File:** `src/lib/mail.ts`
- [ ] API key configured in environment
- [ ] From email: `onboarding@resend.dev` (dev) or custom domain (prod)
- [ ] **Function:** `sendVerificationEmail(email, token)`

#### 2. Email Template
- [ ] **File:** `src/lib/mail.ts:6-22` (verification email)
- [ ] Subject: "Confirm your email"
- [ ] Contains verification link
- [ ] Link format: `{baseUrl}/new-verification?token={token}`
- [ ] HTML template with styling
- [ ] Plain text fallback

#### 3. Link Generation
- [ ] Base URL determined by environment
- [ ] Development: `http://localhost:3000`
- [ ] Production: `https://ed.databayt.org`
- [ ] Subdomain support: Inherits from current domain
- [ ] Token appended as query parameter

#### 4. Email Deliverability
- [ ] Resend API key valid
- [ ] From domain verified (for production)
- [ ] SPF/DKIM records configured (production)
- [ ] Test email delivery in development
- [ ] Monitor bounce rate

### Verification Flow

#### 1. Verification Page
- [ ] **File:** `src/app/[lang]/(auth)/new-verification/page.tsx`
- [ ] **Component:** `src/components/auth/verification/form.tsx`
- [ ] Extracts token from URL query parameter
- [ ] Displays loading state while verifying
- [ ] Shows success or error message

#### 2. Verification Action
- [ ] **File:** `src/components/auth/verification/action.ts`
- [ ] **Function:** `newVerification(token: string)`
- [ ] Token lookup in database
- [ ] Token expiry check
- [ ] Email extraction from token
- [ ] User lookup by email
- [ ] Email update: `emailVerified: new Date()`
- [ ] Token deletion

#### 3. Token Expiry Check
- [ ] **File:** `src/components/auth/verification/action.ts:24-26`
- [ ] Compare `token.expires` with current time
- [ ] If expired: return error "Token expired"
- [ ] Delete expired token
- [ ] Provide link to request new token

#### 4. Token Cleanup
- [ ] ⚠️ **Issue:** Uses `setTimeout` for deletion (unreliable in serverless)
- [ ] **File:** `src/components/auth/verification/action.ts:57-62`
- [ ] **Better approach:** Delete immediately after verification
- [ ] Consider: Background job for expired token cleanup

#### 5. Success Handling
- [ ] User's `emailVerified` field updated
- [ ] Success message shown
- [ ] Auto-redirect to login page (optional)
- [ ] ⚠️ Consider: Auto-login after verification

### Resend Verification

#### 1. Resend Trigger
- [ ] Login page shows resend link if email not verified
- [ ] **File:** `src/components/auth/login/action.ts:40-42`
- [ ] Registration success page shows resend link
- [ ] Dedicated resend page/button

#### 2. Resend Action
- [ ] Same as initial verification email generation
- [ ] **Function:** `generateVerificationToken(email)`
- [ ] Old token deleted, new token created
- [ ] Email sent with new token
- [ ] ⚠️ **Add:** Rate limiting on resend (prevent email spam)

#### 3. Resend Rate Limiting
- [ ] ❌ **Missing:** Rate limit on resend requests
- [ ] **Recommendation:** Max 3 resends per hour
- [ ] Track resend count in token record or separate table
- [ ] Return error if limit exceeded

### Testing Steps

- [ ] **Test 1:** Initial verification email
  - Register new account
  - Check email inbox
  - Verify email received within 30 seconds
  - Verify link format is correct
  - Click link
  - Verify redirect to verification page

- [ ] **Test 2:** Successful verification
  - Click verification link
  - Verify success message shown
  - Check database: `emailVerified` is timestamp
  - Verify token deleted from database
  - Try to login
  - Verify login succeeds (after fix)

- [ ] **Test 3:** Expired token
  - Generate verification token
  - Manually update token expiry to past date
  - Click verification link
  - Verify error: "Token expired"
  - Verify resend link provided

- [ ] **Test 4:** Invalid token
  - Navigate to `/new-verification?token=invalid-uuid`
  - Verify error: "Token does not exist"

- [ ] **Test 5:** Already verified
  - Verify account
  - Try to verify again with same token
  - Verify error or success message (token already deleted)

- [ ] **Test 6:** Resend verification
  - Register account
  - Don't verify
  - Try to login
  - Click "Resend verification email"
  - Verify new email sent
  - Verify old token deleted
  - Click new link
  - Verify successful verification

- [ ] **Test 7:** Email deliverability
  - Test with Gmail, Outlook, Yahoo accounts
  - Verify email not in spam folder
  - Verify email formatting looks good

- [ ] **Test 8:** Token expiry timing
  - Generate token
  - Wait 59 minutes
  - Verify link still works
  - Wait 2 more minutes (total 61 min)
  - Verify link expired

### Security Checklist
- [ ] ✅ UUID v4 provides sufficient randomness
- [ ] ✅ Token expires after 1 hour
- [ ] ✅ Token deleted after successful verification
- [ ] ✅ HTTPS prevents token interception
- [ ] ⚠️ **Add:** Rate limiting on resend
- [ ] ⚠️ **Fix:** Delete token immediately, not via setTimeout
- [ ] ⚠️ **Consider:** Add email verification reminder (before expiry)

---

## 🔵 Two-Factor Authentication (2FA) Checklist

### 2FA Enrollment

#### 1. Enrollment Trigger
- [ ] User navigates to settings/security page
- [ ] Clicks "Enable Two-Factor Authentication"
- [ ] **File:** Check if enrollment UI exists
- [ ] ⚠️ **Note:** 2FA enrollment UI may be incomplete

#### 2. Token Generation for 2FA
- [ ] **File:** `src/components/auth/tokens.ts:58-76`
- [ ] **Function:** `generateTwoFactorToken(email: string)`
- [ ] Token format: 6-digit number
- [ ] ⚠️ **Security issue:** Uses `crypto.randomInt(100_000, 1_000_000)`
- [ ] Only ~900,000 possible values (weak)
- [ ] Expiration: 5 minutes (hardcoded in generation)
- [ ] Stored in `TwoFactorToken` table

#### 3. 2FA Token Storage
- [ ] **Schema:** `prisma/models/two-factor-token.prisma`
- [ ] Fields: `id`, `email`, `token`, `expires`
- [ ] Unique constraint on `email`
- [ ] Old token deleted before creating new one

#### 4. 2FA Token Delivery
- [ ] **File:** `src/lib/mail.ts:36-49`
- [ ] **Function:** `sendTwoFactorTokenEmail(email, token)`
- [ ] Email subject: "2FA Code"
- [ ] Token displayed in email body
- [ ] HTML template for better formatting
- [ ] Expiry notice in email (5 minutes)

#### 5. User 2FA Flag
- [ ] **Schema:** `prisma/models/user.prisma`
- [ ] Field: `isTwoFactorEnabled` (Boolean)
- [ ] Updated when user enables/disables 2FA
- [ ] Checked during login flow

### 2FA Login Flow

#### 1. 2FA Detection
- [ ] **File:** `src/components/auth/login/action.ts:58-106`
- [ ] After credentials validated
- [ ] Check if `user.isTwoFactorEnabled === true`
- [ ] If enabled: generate and send 2FA token
- [ ] If disabled: complete login

#### 2. 2FA Code Input
- [ ] **File:** `src/components/auth/login/form.tsx`
- [ ] Check if 2FA code field exists
- [ ] 6-digit input field
- [ ] Submitted with login credentials
- [ ] ⚠️ **Verify:** 2FA flow implementation completeness

#### 3. 2FA Token Verification
- [ ] **File:** `src/components/auth/login/action.ts:68-84`
- [ ] If 2FA code provided:
  - [ ] Lookup token in database
  - [ ] Check token matches
  - [ ] Check token not expired
  - [ ] Delete token after successful verification
  - [ ] Delete confirmation record
- [ ] If verification fails: return error

#### 4. 2FA Confirmation Record
- [ ] **Schema:** `prisma/models/two-factor-confirmation.prisma`
- [ ] Fields: `id`, `userId`
- [ ] Purpose: Track 2FA completion
- [ ] Created after successful 2FA verification
- [ ] Deleted on next login (cleanup)

### Backup Codes

#### 1. Backup Code Generation
- [ ] ❌ **Missing:** Backup code generation not implemented
- [ ] **Recommendation:** Generate 10 single-use codes
- [ ] Format: 8-character alphanumeric (e.g., "A1B2C3D4")
- [ ] Hashed before storage (like passwords)
- [ ] Shown to user only once (download/print)

#### 2. Backup Code Storage
- [ ] ❌ **Missing:** Database schema for backup codes
- [ ] **Recommended schema:**
  ```prisma
  model TwoFactorBackupCode {
    id        String   @id @default(cuid())
    userId    String
    code      String   // Hashed
    used      Boolean  @default(false)
    usedAt    DateTime?
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    @@index([userId])
  }
  ```

#### 3. Backup Code Usage
- [ ] ❌ **Missing:** Backup code verification logic
- [ ] Should allow backup code instead of 2FA token
- [ ] Mark code as used after successful verification
- [ ] Warning when running low on codes (< 3 remaining)

### Account Recovery

#### 1. Disable 2FA via Email
- [ ] ❌ **Missing:** Recovery mechanism if can't access 2FA
- [ ] **Recommendation:** "Lost 2FA device" link
- [ ] Send recovery email with time-limited link
- [ ] Require password re-entry
- [ ] Disable 2FA after verification
- [ ] Send notification email

#### 2. Trusted Devices
- [ ] ❌ **Missing:** "Trust this device" option
- [ ] Skip 2FA for 30 days on trusted device
- [ ] Store device fingerprint in database
- [ ] Allow user to view and revoke trusted devices

### Testing Steps

- [ ] **Test 1:** Enable 2FA
  - Login to account
  - Navigate to security settings
  - Click "Enable 2FA"
  - Verify token email sent
  - Enter token
  - Verify 2FA enabled in database

- [ ] **Test 2:** Login with 2FA
  - Logout from account with 2FA enabled
  - Enter email and password
  - Verify 2FA code email sent
  - Enter code
  - Verify successful login

- [ ] **Test 3:** Invalid 2FA code
  - Login with 2FA enabled account
  - Enter wrong 2FA code
  - Verify error message
  - Verify login denied

- [ ] **Test 4:** Expired 2FA code
  - Login, receive 2FA code
  - Wait 6 minutes
  - Try to use expired code
  - Verify error: "Token expired"
  - Verify option to resend code

- [ ] **Test 5:** Resend 2FA code
  - Login with 2FA enabled
  - Click "Resend code"
  - Verify new code sent
  - Verify old code invalidated
  - Use new code
  - Verify login succeeds

- [ ] **Test 6:** Disable 2FA
  - Login to account
  - Navigate to security settings
  - Click "Disable 2FA"
  - Verify 2FA disabled in database
  - Logout and login again
  - Verify no 2FA prompt

- [ ] **Test 7:** Backup codes (after implementation)
  - Enable 2FA
  - Generate backup codes
  - Verify 10 codes generated
  - Download/print codes
  - Disable 2FA device access
  - Login using backup code
  - Verify code marked as used
  - Verify warning when <3 codes remain

- [ ] **Test 8:** Account recovery (after implementation)
  - Enable 2FA
  - Simulate lost device
  - Click "Lost 2FA device" link
  - Verify recovery email sent
  - Complete recovery process
  - Verify 2FA disabled

### Security Checklist
- [ ] ⚠️ **Fix:** Improve token randomness (6 digits → cryptographically secure)
- [ ] ⚠️ **Add:** Backup code generation and verification
- [ ] ⚠️ **Add:** Account recovery mechanism
- [ ] ⚠️ **Add:** Trusted device feature
- [ ] ⚠️ **Add:** Rate limiting on 2FA code requests
- [ ] ✅ Tokens expire after 5 minutes
- [ ] ✅ Tokens deleted after successful verification
- [ ] ✅ Email delivery for 2FA codes

**Recommended 2FA Token Improvement:**
```typescript
// Current (WEAK):
const token = crypto.randomInt(100_000, 1_000_000).toString();

// Improved:
function generateSecure2FAToken(): string {
  // Generate cryptographically secure 6-digit code
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, '0');
}
```

---

## 🔵 Password Reset Checklist

### Reset Request Flow

#### 1. Reset Request Page
- [ ] **File:** `src/app/[lang]/(auth)/reset/page.tsx`
- [ ] **Component:** `src/components/auth/reset/form.tsx`
- [ ] Email input field
- [ ] Submit button
- [ ] Link back to login

#### 2. Reset Request Validation
- [ ] **File:** `src/components/auth/validation.ts`
- [ ] **Schema:** `ResetSchema`
- [ ] Email format validation
- [ ] Client-side validation with react-hook-form

#### 3. Reset Request Action
- [ ] **File:** `src/components/auth/reset/action.ts`
- [ ] **Function:** `reset(values: ResetFormData)`
- [ ] ⚠️ **Missing:** Rate limiting - ADD THIS
- [ ] Server-side validation
- [ ] User lookup by email
- [ ] Multi-tenant user lookup (email + schoolId)
- [ ] Generic success message (even if email doesn't exist)

#### 4. Reset Token Generation
- [ ] **File:** `src/components/auth/tokens.ts:29-55`
- [ ] **Function:** `generatePasswordResetToken(email: string)`
- [ ] Token format: UUID v4
- [ ] Expiration: 1 hour (3600 seconds * 1000 ms)
- [ ] Stored in `PasswordResetToken` table
- [ ] Old tokens deleted before creating new one

#### 5. Reset Token Storage
- [ ] **Schema:** `prisma/models/password-reset-token.prisma`
- [ ] Fields: `id`, `email`, `token`, `expires`
- [ ] Unique constraint on `email`
- [ ] Old tokens automatically replaced

#### 6. Reset Email Sending
- [ ] **File:** `src/lib/mail.ts:24-34`
- [ ] **Function:** `sendPasswordResetEmail(email, token)`
- [ ] Email subject: "Reset your password"
- [ ] Contains reset link
- [ ] Link format: `{baseUrl}/new-password?token={token}`
- [ ] HTML template
- [ ] Expiry notice (1 hour)

### Password Update Flow

#### 1. New Password Page
- [ ] **File:** `src/app/[lang]/(auth)/new-password/page.tsx`
- [ ] **Component:** `src/components/auth/password/form.tsx`
- [ ] Token extracted from URL query parameter
- [ ] Password input field
- [ ] Confirm password field
- [ ] Submit button

#### 2. Password Validation
- [ ] **File:** `src/components/auth/validation.ts`
- [ ] **Schema:** `NewPasswordSchema`
- [ ] Password strength validation
- [ ] ⚠️ **Current:** 6 characters minimum (TOO WEAK)
- [ ] ⚠️ **Need:** 12+ with complexity requirements
- [ ] Confirm password matching

#### 3. Password Update Action
- [ ] **File:** `src/components/auth/password/action.ts`
- [ ] **Function:** `newPassword(values, token)`
- [ ] Token validation
- [ ] Token expiry check
- [ ] User lookup by email from token
- [ ] Password hashing with bcrypt
- [ ] User password update
- [ ] Token deletion

#### 4. Token Expiry Check
- [ ] **File:** `src/components/auth/password/action.ts:26-28`
- [ ] Compare `token.expires` with current time
- [ ] If expired: return error
- [ ] Delete expired token
- [ ] Provide link to request new token

#### 5. Password Update Security
- [ ] Password hashed with bcrypt (10 rounds)
- [ ] Old password not required (reset flow)
- [ ] Token deleted immediately after use
- [ ] User logged out from all sessions (optional)
- [ ] Email notification of password change

#### 6. Success Handling
- [ ] Success message shown
- [ ] Auto-redirect to login page
- [ ] ⚠️ **Missing:** Email notification of password change
- [ ] ⚠️ **Consider:** Auto-login after reset

### Security Measures

#### 1. Rate Limiting
- [ ] ⚠️ **Missing:** Rate limit on reset requests
- [ ] **Recommendation:** Max 3 requests per hour per IP
- [ ] **Recommendation:** Max 5 requests per day per email
- [ ] Prevents email enumeration
- [ ] Prevents spam

#### 2. Token Security
- [ ] ✅ UUID v4 provides sufficient randomness
- [ ] ✅ Token expires after 1 hour
- [ ] ✅ Token deleted after use
- [ ] ✅ HTTPS prevents interception
- [ ] ⚠️ **Consider:** Shorter token expiry (30 minutes)

#### 3. Email Enumeration Prevention
- [ ] ✅ Same success message whether email exists or not
- [ ] **File:** `src/components/auth/reset/action.ts:23`
- [ ] "If email exists, reset link sent" (generic message)
- [ ] Prevents attackers from discovering valid emails

#### 4. Password Change Notification
- [ ] ⚠️ **Missing:** Email notification after password change
- [ ] Should notify user of password change
- [ ] Helps detect unauthorized resets
- [ ] Include date/time and IP address

### Testing Steps

- [ ] **Test 1:** Valid reset request
  - Navigate to reset page
  - Enter registered email
  - Submit form
  - Verify success message (generic)
  - Check email inbox
  - Verify reset email received
  - Verify link format correct

- [ ] **Test 2:** Non-existent email
  - Enter email that doesn't exist
  - Submit form
  - Verify same success message (prevents enumeration)
  - Verify no email sent
  - Verify no token created in database

- [ ] **Test 3:** Successful password reset
  - Request password reset
  - Click link in email
  - Enter new password (meeting requirements)
  - Confirm new password
  - Submit
  - Verify success message
  - Verify token deleted from database
  - Try to login with new password
  - Verify login succeeds

- [ ] **Test 4:** Expired reset token
  - Generate reset token
  - Manually update expiry to past date
  - Try to use link
  - Verify error: "Token expired"
  - Verify link to request new token

- [ ] **Test 5:** Invalid reset token
  - Navigate to `/new-password?token=invalid-uuid`
  - Verify error: "Invalid token"

- [ ] **Test 6:** Token reuse prevention
  - Complete password reset
  - Try to use same link again
  - Verify error: "Token does not exist" (already deleted)

- [ ] **Test 7:** Password strength validation
  - Try weak password (< 12 chars after fix)
  - Verify error shown
  - Try password without uppercase
  - Verify error shown
  - Use strong password meeting all requirements
  - Verify success

- [ ] **Test 8:** Password confirmation mismatch
  - Enter different passwords
  - Verify error: "Passwords do not match"

- [ ] **Test 9:** Multiple reset requests
  - Request reset for same email
  - Request again immediately
  - Verify old token invalidated
  - Verify only latest link works

- [ ] **Test 10:** Rate limiting (after implementation)
  - Make 4 reset requests in quick succession
  - Verify rate limit error on 4th attempt
  - Wait required time
  - Verify request allowed again

- [ ] **Test 11:** Multi-tenant password reset
  - User exists in school1 with email
  - Request reset from `school1.localhost:3000`
  - Verify reset email sent
  - Complete reset
  - Try to login to school1
  - Verify success

### Security Checklist
- [ ] ⚠️ **Add:** Rate limiting on reset requests
- [ ] ⚠️ **Add:** Email notification after password change
- [ ] ⚠️ **Fix:** Strengthen password requirements (6 → 12+ chars)
- [ ] ✅ UUID v4 token randomness
- [ ] ✅ Token expires after 1 hour
- [ ] ✅ Token deleted after use
- [ ] ✅ Generic error messages (no email enumeration)
- [ ] ✅ Password hashed with bcrypt
- [ ] ⚠️ **Consider:** Shorter token expiry (30 min)
- [ ] ⚠️ **Consider:** Logout all sessions after password change

---

## 🔵 Resend Emails Checklist

### Verification Email Resend

#### 1. Resend Trigger Locations
- [ ] Login page when email not verified
  - **File:** `src/components/auth/login/action.ts:40-42`
  - Shows after failed login attempt
  - Sends new verification email
- [ ] Registration success page
  - **Check:** If dedicated resend button exists
- [ ] Verification page if token expired
  - **Check:** If resend link provided on expiry

#### 2. Resend Mechanism
- [ ] Uses same function as initial send
- [ ] **Function:** `generateVerificationToken(email)`
- [ ] Deletes old token
- [ ] Creates new token with fresh expiry
- [ ] Sends email via Resend API

#### 3. Rate Limiting
- [ ] ⚠️ **Missing:** No rate limit on resend requests
- [ ] **Risk:** Email spam, abuse
- [ ] **Recommendation:** Max 3 resends per hour
- [ ] **Recommendation:** Max 10 resends per day
- [ ] Track resend count per email

#### 4. User Experience
- [ ] Clear button/link text: "Resend verification email"
- [ ] Success feedback: "Email sent! Check your inbox"
- [ ] Disable button for 60 seconds after send (UI rate limit)
- [ ] Show countdown timer for next resend

### Password Reset Email Resend

#### 1. Resend Trigger
- [ ] **Check:** If "Didn't receive email?" link exists on reset confirmation
- [ ] **Check:** If resend option on new-password page
- [ ] User can request new reset from `/reset` page

#### 2. Resend Mechanism
- [ ] Re-execute password reset action
- [ ] **Function:** `generatePasswordResetToken(email)`
- [ ] Invalidates old token
- [ ] Creates new token with fresh expiry
- [ ] Sends new email

#### 3. Rate Limiting
- [ ] ⚠️ **Missing:** No rate limit on password reset requests
- [ ] **Risk:** Email enumeration, spam
- [ ] **Recommendation:** Max 3 requests per hour per IP
- [ ] **Recommendation:** Max 5 requests per day per email

### 2FA Token Resend

#### 1. Resend Trigger
- [ ] **Check:** If "Resend code" link exists on 2FA input page
- [ ] Should be available during login when 2FA required
- [ ] **File:** Check `src/components/auth/login/form.tsx`

#### 2. Resend Mechanism
- [ ] Re-generate 2FA token
- [ ] **Function:** `generateTwoFactorToken(email)`
- [ ] Invalidates old token
- [ ] Creates new token (5 min expiry)
- [ ] Sends email with new code

#### 3. Rate Limiting
- [ ] ⚠️ **Missing:** No rate limit on 2FA resend
- [ ] **Recommendation:** Max 5 resends per hour
- [ ] Prevents code guessing via rapid requests

### General Resend Implementation

#### 1. Rate Limiting Strategy
- [ ] Create `EmailRateLimit` table:
  ```prisma
  model EmailRateLimit {
    id        String   @id @default(cuid())
    email     String
    type      String   // "verification" | "reset" | "2fa"
    count     Int      @default(1)
    resetAt   DateTime
    @@unique([email, type])
  }
  ```
- [ ] Track sends per email per type
- [ ] Reset count after time window
- [ ] Return error if limit exceeded

#### 2. Rate Limit Function
- [ ] **New file:** `src/lib/email-rate-limit.ts`
- [ ] **Function:** `checkEmailRateLimit(email, type)`
- [ ] Check current count
- [ ] If within limit: increment and allow
- [ ] If exceeded: return error
- [ ] Auto-reset after time window

#### 3. User Feedback
- [ ] Clear error messages:
  - "Too many requests. Please try again in X minutes"
  - "Email sent successfully! Check your inbox"
  - "If you don't see the email, check your spam folder"
- [ ] Visual feedback: Success/error toast notifications
- [ ] Disable resend button temporarily after send

#### 4. Email Deliverability
- [ ] Monitor email bounce rate
- [ ] Set up SPF/DKIM for custom domain
- [ ] Use reputable email service (Resend)
- [ ] Test with multiple email providers
- [ ] Verify emails not marked as spam

### Testing Steps

#### Verification Email Resend
- [ ] **Test 1:** Resend from login page
  - Register account, don't verify
  - Try to login
  - Click "Resend verification email"
  - Verify new email received
  - Use new link to verify
  - Verify success

- [ ] **Test 2:** Resend rate limit
  - Click resend 3 times rapidly
  - Verify 4th attempt blocked
  - Verify error message clear
  - Wait required time
  - Verify resend allowed again

#### Password Reset Resend
- [ ] **Test 3:** Multiple reset requests
  - Request password reset
  - Request again for same email
  - Verify new email sent
  - Verify old link no longer works
  - Verify new link works

- [ ] **Test 4:** Reset rate limit
  - Make 3 reset requests
  - Verify 4th blocked
  - Verify error message
  - Check IP-based limit
  - Check email-based limit

#### 2FA Token Resend
- [ ] **Test 5:** Resend 2FA code
  - Login with 2FA enabled account
  - Click "Resend code"
  - Verify new code sent
  - Verify old code invalid
  - Use new code
  - Verify login succeeds

- [ ] **Test 6:** 2FA resend rate limit
  - Request 2FA code 5 times
  - Verify 6th attempt blocked
  - Verify clear error message

#### Email Deliverability
- [ ] **Test 7:** Multiple email providers
  - Test with Gmail
  - Test with Outlook
  - Test with Yahoo
  - Verify all receive emails
  - Verify not in spam

- [ ] **Test 8:** Email content
  - Verify HTML renders correctly
  - Verify plain text fallback works
  - Verify links are clickable
  - Verify branding consistent

### Security Checklist
- [ ] ⚠️ **Add:** Rate limiting on all resend operations
- [ ] ⚠️ **Add:** Email rate limit tracking in database
- [ ] ⚠️ **Add:** IP-based rate limiting for password resets
- [ ] ⚠️ **Add:** Logging of all email sends for audit
- [ ] ✅ Old tokens invalidated on resend
- [ ] ✅ Fresh expiry times on new tokens
- [ ] ⚠️ **Consider:** CAPTCHA for excessive resend requests
- [ ] ⚠️ **Consider:** User notification if many resend requests

**Recommended Rate Limits:**
- **Verification email:** 3 per hour, 10 per day
- **Password reset:** 3 per hour per IP, 5 per day per email
- **2FA token:** 5 per hour

---

## 📋 Testing Requirements

### Unit Tests (50+ tests needed)

#### Auth Validation Tests
- [ ] `src/components/auth/validation.test.ts` (NEW)
  - [ ] LoginSchema: valid credentials
  - [ ] LoginSchema: invalid email format
  - [ ] LoginSchema: missing password
  - [ ] RegisterSchema: valid data
  - [ ] RegisterSchema: password too short
  - [ ] RegisterSchema: password mismatch
  - [ ] ResetSchema: valid email
  - [ ] NewPasswordSchema: password strength
  - [ ] **File to test:** `src/components/auth/validation.ts`

#### Token Generation Tests
- [ ] `src/components/auth/tokens.test.ts` (NEW)
  - [ ] generateVerificationToken: creates UUID
  - [ ] generateVerificationToken: sets 1 hour expiry
  - [ ] generateVerificationToken: deletes old tokens
  - [ ] generatePasswordResetToken: creates UUID
  - [ ] generateTwoFactorToken: creates 6-digit code
  - [ ] generateTwoFactorToken: sets 5 min expiry
  - [ ] **File to test:** `src/components/auth/tokens.ts`

#### Server Action Tests
- [ ] `src/components/auth/login/action.test.ts` (NEW)
  - [ ] Login: successful with valid credentials
  - [ ] Login: fails with wrong password
  - [ ] Login: fails with non-existent email
  - [ ] Login: triggers 2FA if enabled
  - [ ] Login: verifies 2FA code correctly
  - [ ] Login: rate limit enforcement
  - [ ] Login: account lockout after failed attempts
  - [ ] **File to test:** `src/components/auth/login/action.ts`

- [ ] `src/components/auth/join/action.test.ts` (NEW)
  - [ ] Register: creates user successfully
  - [ ] Register: hashes password with bcrypt
  - [ ] Register: prevents duplicate email in same school
  - [ ] Register: allows duplicate email across schools
  - [ ] Register: generates verification token
  - [ ] Register: sends verification email
  - [ ] Register: rate limit enforcement
  - [ ] **File to test:** `src/components/auth/join/action.ts`

- [ ] `src/components/auth/reset/action.test.ts` (NEW)
  - [ ] Reset: generates token for valid email
  - [ ] Reset: sends reset email
  - [ ] Reset: returns generic message for invalid email
  - [ ] Reset: rate limit enforcement
  - [ ] **File to test:** `src/components/auth/reset/action.ts`

- [ ] `src/components/auth/password/action.test.ts` (NEW)
  - [ ] NewPassword: updates password with valid token
  - [ ] NewPassword: fails with expired token
  - [ ] NewPassword: fails with invalid token
  - [ ] NewPassword: deletes token after use
  - [ ] NewPassword: hashes new password
  - [ ] **File to test:** `src/components/auth/password/action.ts`

- [ ] `src/components/auth/verification/action.test.ts` (NEW)
  - [ ] Verification: verifies email with valid token
  - [ ] Verification: fails with expired token
  - [ ] Verification: fails with invalid token
  - [ ] Verification: deletes token after verification
  - [ ] Verification: updates emailVerified timestamp
  - [ ] **File to test:** `src/components/auth/verification/action.ts`

#### Email Utility Tests
- [ ] `src/lib/mail.test.ts` (NEW OR EXTEND)
  - [ ] sendVerificationEmail: formats correctly
  - [ ] sendPasswordResetEmail: includes token
  - [ ] sendTwoFactorTokenEmail: sends code
  - [ ] Email templates render HTML correctly
  - [ ] **File to test:** `src/lib/mail.ts`

#### Helper Function Tests
- [ ] `src/lib/tenant-context.test.ts` (NEW OR EXTEND)
  - [ ] getTenantContext: extracts from subdomain
  - [ ] getTenantContext: extracts from session
  - [ ] getTenantContext: handles impersonation
  - [ ] **File to test:** `src/lib/tenant-context.ts`

### Integration Tests (30+ tests needed)

#### Complete Flow Tests
- [ ] **Login Flow Integration**
  - [ ] Complete credentials login with session creation
  - [ ] Login with 2FA enabled end-to-end
  - [ ] Login redirect to correct subdomain
  - [ ] Multi-tenant login isolation

- [ ] **Registration Flow Integration**
  - [ ] Complete registration → verification → login
  - [ ] Registration with duplicate email handling
  - [ ] Multi-tenant registration

- [ ] **Password Reset Flow Integration**
  - [ ] Request reset → receive email → update password → login
  - [ ] Token expiry during reset flow
  - [ ] Multiple reset requests

- [ ] **OAuth Flow Integration**
  - [ ] Google OAuth new user registration
  - [ ] Google OAuth existing user login
  - [ ] Facebook OAuth new user registration
  - [ ] Facebook OAuth existing user login
  - [ ] Account linking (OAuth + credentials)

#### Database Integration Tests
- [ ] User creation and retrieval
- [ ] Token storage and deletion
- [ ] Multi-tenant uniqueness constraints
- [ ] Session persistence
- [ ] Account linking records

### E2E Tests (Playwright - 25+ tests needed)

#### Critical User Journeys
- [ ] `e2e/auth/login.spec.ts` (NEW)
  - [ ] User can login with valid credentials
  - [ ] Login fails with invalid credentials
  - [ ] Login redirects to dashboard
  - [ ] Login with 2FA works end-to-end
  - [ ] Multi-tenant login isolation

- [ ] `e2e/auth/register.spec.ts` (NEW)
  - [ ] User can register new account
  - [ ] Registration sends verification email
  - [ ] Email verification works
  - [ ] Duplicate email shows error
  - [ ] Password strength validated

- [ ] `e2e/auth/oauth.spec.ts` (NEW)
  - [ ] Google OAuth login (requires test account)
  - [ ] Facebook OAuth login (requires test account)
  - [ ] OAuth creates new user
  - [ ] OAuth links existing account

- [ ] `e2e/auth/password-reset.spec.ts` (NEW)
  - [ ] Complete password reset flow
  - [ ] Reset email received
  - [ ] Token expiry handled
  - [ ] Can login after reset

- [ ] `e2e/auth/2fa.spec.ts` (NEW)
  - [ ] Enable 2FA in settings
  - [ ] 2FA code required on next login
  - [ ] 2FA code verification works
  - [ ] Disable 2FA works

- [ ] `e2e/auth/session.spec.ts` (NEW)
  - [ ] Session persists across page refreshes
  - [ ] Logout clears session
  - [ ] Session expires after 24 hours
  - [ ] Concurrent sessions work

### Security Tests (15+ tests needed)

#### Penetration Testing Scenarios
- [ ] **SQL Injection Attempts**
  - [ ] Inject SQL in email field
  - [ ] Inject SQL in password field
  - [ ] Verify Prisma prevents all attempts

- [ ] **XSS Attempts**
  - [ ] Inject script in registration form
  - [ ] Inject script in login form
  - [ ] Verify React escaping works

- [ ] **CSRF Attempts**
  - [ ] Try login without CSRF token
  - [ ] Verify NextAuth CSRF protection

- [ ] **Rate Limiting**
  - [ ] Verify rate limit on login after 5 attempts
  - [ ] Verify rate limit on password reset
  - [ ] Verify rate limit on email resends

- [ ] **Account Enumeration**
  - [ ] Verify login error doesn't reveal if email exists
  - [ ] Verify reset error is generic
  - [ ] Timing attacks prevented

- [ ] **Session Security**
  - [ ] Session cookie httpOnly flag set
  - [ ] Session cookie secure flag in production
  - [ ] Session expires correctly

- [ ] **Multi-Tenant Isolation**
  - [ ] User in school1 can't access school2 data
  - [ ] Same email different schools isolated
  - [ ] Cross-tenant actions denied

### Test Coverage Goals
- [ ] **Unit Tests:** 80%+ coverage
- [ ] **Integration Tests:** All critical flows covered
- [ ] **E2E Tests:** All user journeys covered
- [ ] **Security Tests:** OWASP Top 10 coverage
- [ ] **Overall:** 85%+ code coverage for auth module

### Test Execution Commands
```bash
# Unit tests
pnpm test src/components/auth/**/*.test.ts
pnpm test src/lib/mail.test.ts

# Integration tests
pnpm test:integration auth

# E2E tests
pnpm test:e2e e2e/auth/
pnpm test:e2e:ui  # Interactive mode

# Coverage report
pnpm test:coverage
```

---

## 🚀 Production Deployment Checklist

### Pre-Deployment (1 week before)

#### 1. Environment Configuration
- [ ] Create production `.env` file
- [ ] Set `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Set `NEXTAUTH_URL=https://ed.databayt.org`
- [ ] Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Configure `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`
- [ ] Set `RESEND_API_KEY` for production email sending
- [ ] Configure production database URL
- [ ] Verify all environment variables in `src/env.mjs`

#### 2. OAuth Provider Configuration
- [ ] **Google Cloud Console:**
  - [ ] Add production redirect URI: `https://ed.databayt.org/api/auth/callback/google`
  - [ ] Add wildcard for subdomains: `https://*.databayt.org/api/auth/callback/google`
  - [ ] Set OAuth consent screen to "Production"
  - [ ] Verify app logo and branding

- [ ] **Facebook Developer:**
  - [ ] Add production redirect URI: `https://ed.databayt.org/api/auth/callback/facebook`
  - [ ] Set app to "Live" mode
  - [ ] Configure app domain: `databayt.org`
  - [ ] Complete privacy policy and terms

#### 3. Email Configuration
- [ ] Verify Resend API key for production
- [ ] Set up custom domain for sending emails
- [ ] Configure SPF record: `v=spf1 include:_spf.resend.com ~all`
- [ ] Configure DKIM records (from Resend dashboard)
- [ ] Test email deliverability to major providers
- [ ] Set up email bounce handling

#### 4. Database Migration
- [ ] Review all pending migrations
- [ ] Test migrations on staging database
- [ ] Back up production database
- [ ] Run migrations: `pnpm prisma migrate deploy`
- [ ] Verify `User`, `Account`, token tables exist
- [ ] Verify indexes on `schoolId` fields

#### 5. Security Hardening
- [ ] ✅ Re-enable PKCE for OAuth (`auth.config.ts`)
- [ ] ✅ Apply rate limiting to all auth actions
- [ ] ✅ Implement account lockout mechanism
- [ ] ✅ Strengthen password policy (12+ chars)
- [ ] ✅ Remove all console.log statements
- [ ] ✅ Enforce email verification before login
- [ ] Set up security headers middleware
- [ ] Configure CORS if needed
- [ ] Enable Sentry error tracking

#### 6. Testing Validation
- [ ] ✅ All unit tests passing
- [ ] ✅ All integration tests passing
- [ ] ✅ All E2E tests passing
- [ ] Run security audit: `pnpm audit`
- [ ] Run dependency check: `pnpm outdated`
- [ ] Test all auth flows in staging:
  - [ ] Credentials login
  - [ ] Google OAuth
  - [ ] Facebook OAuth
  - [ ] Registration
  - [ ] Email verification
  - [ ] Password reset
  - [ ] 2FA
  - [ ] Multi-tenant isolation

### Deployment Day

#### 1. Final Checks
- [ ] Verify all environment variables set in Vercel
- [ ] Verify database connection string
- [ ] Verify OAuth redirect URIs
- [ ] Run `pnpm build` locally successfully
- [ ] Run `pnpm tsc --noEmit` (0 errors)
- [ ] Check Vercel build logs

#### 2. Deploy to Production
- [ ] Merge to `main` branch
- [ ] Tag release: `git tag -a v1.0.0-auth -m "Auth production release"`
- [ ] Push tag: `git push origin v1.0.0-auth`
- [ ] Monitor Vercel deployment
- [ ] Verify build completes successfully
- [ ] Check for deployment errors

#### 3. Smoke Tests (Immediately After Deployment)
- [ ] **Test 1:** Visit https://ed.databayt.org
- [ ] **Test 2:** Click "Login" → verify page loads
- [ ] **Test 3:** Click "Sign Up" → verify page loads
- [ ] **Test 4:** Click "Continue with Google" → verify OAuth starts
- [ ] **Test 5:** Click "Continue with Facebook" → verify OAuth starts
- [ ] **Test 6:** Test credentials login with test account
- [ ] **Test 7:** Test registration with new email
- [ ] **Test 8:** Test email verification email received
- [ ] **Test 9:** Test password reset flow
- [ ] **Test 10:** Test multi-tenant login (subdomain)

#### 4. Monitoring Setup
- [ ] Verify Sentry capturing errors
- [ ] Set up error alerts for auth failures
- [ ] Monitor email delivery rate
- [ ] Monitor OAuth success rate
- [ ] Set up uptime monitoring for auth endpoints
- [ ] Create dashboard for auth metrics

### Post-Deployment (First 24 Hours)

#### 1. Monitor Key Metrics
- [ ] Login success rate (target: >95%)
- [ ] Registration completion rate
- [ ] Email delivery rate (target: >98%)
- [ ] OAuth success rate (Google, Facebook)
- [ ] Error rate (target: <1%)
- [ ] Response times (target: <500ms)

#### 2. User Feedback
- [ ] Monitor support tickets for auth issues
- [ ] Check user feedback channels
- [ ] Address any UX issues quickly
- [ ] Document common issues

#### 3. Security Monitoring
- [ ] Review failed login attempts
- [ ] Check for unusual patterns (brute force, enumeration)
- [ ] Verify rate limiting working
- [ ] Verify account lockouts triggering correctly
- [ ] Monitor Sentry for security errors

### Week 1 Post-Deployment

#### 1. Performance Analysis
- [ ] Review auth endpoint response times
- [ ] Identify slow queries
- [ ] Optimize as needed
- [ ] Review database indexes

#### 2. User Onboarding
- [ ] Analyze registration funnel drop-off
- [ ] Improve UX based on data
- [ ] A/B test email verification messaging
- [ ] Optimize OAuth button placement

#### 3. Documentation
- [ ] Update production deployment docs
- [ ] Document common issues and fixes
- [ ] Create runbook for auth incidents
- [ ] Update FAQ based on user questions

---

## 🛡️ Multi-Tenant Safety Verification

### Database Schema Verification

#### 1. User Model Multi-Tenant Fields
- [ ] **File:** `prisma/models/user.prisma`
- [ ] `schoolId` field exists
- [ ] `schoolId` is nullable (allows DEVELOPER role)
- [ ] Relation to School model defined
- [ ] Index on `schoolId`: `@@index([schoolId])`
- [ ] Unique constraint: `@@unique([email, schoolId])`

#### 2. All Business Models
- [ ] Verify every business model has `schoolId`
- [ ] Verify indexes on `schoolId` for performance
- [ ] Verify compound unique constraints include `schoolId`
- [ ] **Models to check:** Student, Teacher, Class, Assignment, etc.

### Auth Action Verification

#### 1. Login Action
- [ ] **File:** `src/components/auth/login/action.ts`
- [ ] User lookup includes tenant context
- [ ] Session includes `schoolId`
- [ ] Redirect logic respects tenant subdomain
- [ ] ✅ Smart subdomain redirect based on user's school (lines 107-156)

#### 2. Registration Action
- [ ] **File:** `src/components/auth/join/action.ts`
- [ ] Gets `schoolId` from tenant context
- [ ] User created with correct `schoolId`
- [ ] Email uniqueness scoped by `schoolId`
- [ ] ✅ Uses `getTenantContext()` (line 22)

#### 3. OAuth Callbacks
- [ ] **File:** `src/auth.ts` (redirect callback)
- [ ] Callback URL preserves tenant context
- [ ] Subdomain detected correctly (lines 639-680)
- [ ] Smart redirect to user's school subdomain (lines 874-978)
- [ ] Session includes correct `schoolId`

### Middleware Verification

#### 1. Subdomain Rewriting
- [ ] **File:** `src/middleware.ts`
- [ ] Production: `*.databayt.org` → `/[lang]/s/[subdomain]/...`
- [ ] Development: `*.localhost` → `/[lang]/s/[subdomain]/...`
- [ ] Preview: `tenant---branch.vercel.app` → `/[lang]/s/tenant/...`
- [ ] **Lines:** 202-264

#### 2. Route Protection
- [ ] Public routes allowed without auth
- [ ] Protected routes require authentication
- [ ] No cross-tenant access via URL manipulation
- [ ] Session includes correct `schoolId` for route

### Tenant Context Verification

#### 1. Context Extraction
- [ ] **File:** `src/lib/tenant-context.ts`
- [ ] Priority order:
  1. Impersonation cookie (admin feature)
  2. Subdomain from header (`x-subdomain`)
  3. Session schoolId
- [ ] Validates subdomain exists in database
- [ ] Returns `schoolId` and `subdomain`

#### 2. Impersonation Security
- [ ] ⚠️ **VERIFY:** Impersonation cookie can only be set server-side
- [ ] ⚠️ **VERIFY:** Only DEVELOPER role can set impersonation
- [ ] Check admin panel code for impersonation logic
- [ ] **Risk:** If client can set cookie, major security hole

### Cross-Tenant Access Prevention

#### 1. Server Actions Audit
- [ ] Audit all server actions in `src/components/platform/*/actions.ts`
- [ ] Verify each action:
  - [ ] Gets `schoolId` from session
  - [ ] Includes `schoolId` in database queries
  - [ ] Never accepts `schoolId` from client
  - [ ] Returns 403 if schoolId mismatch

**Pattern to verify:**
```typescript
export async function someAction(data: FormData) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  if (!schoolId) throw new Error("Unauthorized");

  // All queries MUST include schoolId
  const items = await db.item.findMany({
    where: { schoolId, /* other filters */ }
  });
}
```

#### 2. API Routes Audit
- [ ] **Files:** `src/app/api/*/route.ts`
- [ ] Verify tenant isolation in all API routes
- [ ] Check authorization middleware
- [ ] Verify no direct database access without `schoolId`

#### 3. Page Components Audit
- [ ] **Files:** `src/app/[lang]/s/[subdomain]/(platform)/*/page.tsx`
- [ ] Verify subdomain parameter used correctly
- [ ] Verify no hardcoded `schoolId` values
- [ ] Verify data fetching respects tenant context

### Testing Multi-Tenant Isolation

#### 1. Create Test Scenarios
- [ ] **Test 1:** Create user in school1
  - Verify user has `schoolId` = school1
  - Login from `school1.localhost:3000`
  - Verify session `schoolId` = school1
  - Verify dashboard shows school1 data only

- [ ] **Test 2:** Cross-tenant URL manipulation
  - Login as school1 user
  - Try to access `school2.localhost:3000/students`
  - Verify redirect or 403 error
  - Verify no school2 data leaked

- [ ] **Test 3:** Same email different schools
  - Create user with `test@example.com` in school1
  - Create user with `test@example.com` in school2
  - Verify both accounts exist
  - Login to school1 → verify correct account
  - Login to school2 → verify correct account

- [ ] **Test 4:** API endpoint isolation
  - Get auth token for school1 user
  - Try to fetch school2 data via API
  - Verify 403 or empty results

- [ ] **Test 5:** Subdomain detection
  - Access `school1.localhost:3000`
  - Verify middleware detects subdomain
  - Verify `x-subdomain` header set
  - Verify rewrites to `/s/school1/...`

#### 2. Penetration Testing
- [ ] Try to bypass tenant isolation via:
  - [ ] Cookie manipulation
  - [ ] Header manipulation
  - [ ] URL parameter injection
  - [ ] GraphQL/API queries
  - [ ] Direct database access (if exposed)

### Security Audit Checklist
- [ ] ✅ All database queries include `schoolId`
- [ ] ✅ `schoolId` never accepted from client
- [ ] ✅ Session includes correct `schoolId`
- [ ] ✅ Subdomain routing prevents cross-tenant access
- [ ] ⚠️ **Verify:** Impersonation cookie security
- [ ] ⚠️ **Audit:** All server actions for tenant isolation
- [ ] ⚠️ **Test:** Cross-tenant URL manipulation prevention
- [ ] ⚠️ **Monitor:** Failed cross-tenant access attempts

---

## ✅ Post-Deployment Validation

### Functional Smoke Tests

#### 1. Authentication Flows
- [ ] **Credentials Login** (2 min)
  - Navigate to `/login`
  - Enter valid credentials
  - Verify redirect to dashboard
  - Verify session created
  - Check browser cookies for session token

- [ ] **Credentials Registration** (3 min)
  - Navigate to `/join`
  - Fill registration form
  - Submit
  - Verify success message
  - Check email for verification link
  - Click verification link
  - Verify email verified
  - Login with new account

- [ ] **Google OAuth** (2 min)
  - Navigate to `/login`
  - Click "Continue with Google"
  - Complete Google authorization
  - Verify redirect to dashboard
  - Verify user created/logged in
  - Check database for Account record

- [ ] **Facebook OAuth** (2 min)
  - Navigate to `/login`
  - Click "Continue with Facebook"
  - Complete Facebook authorization
  - Verify redirect to dashboard
  - Verify user created/logged in

- [ ] **Password Reset** (3 min)
  - Navigate to `/reset`
  - Enter email
  - Check email for reset link
  - Click link
  - Enter new password
  - Verify success
  - Login with new password

- [ ] **2FA Flow** (5 min)
  - Login to account with 2FA enabled
  - Verify 2FA code email sent
  - Enter code
  - Verify login succeeds
  - Test wrong code → verify error

- [ ] **Logout** (1 min)
  - Click logout button
  - Verify redirect to home/login
  - Verify session cleared
  - Try to access protected route
  - Verify redirect to login

#### 2. Multi-Tenant Flows
- [ ] **Subdomain Access** (3 min)
  - Access `school1.databayt.org`
  - Login as school1 user
  - Verify dashboard shows school1 branding
  - Verify data is school1 specific

- [ ] **Cross-Tenant Isolation** (3 min)
  - Login as school1 user
  - Manually navigate to `school2.databayt.org`
  - Verify redirect or access denied
  - Verify no school2 data visible

- [ ] **Same Email Different Schools** (5 min)
  - Verify user with `test@example.com` in school1
  - Verify user with `test@example.com` in school2
  - Login to school1 with email
  - Verify correct account
  - Logout
  - Login to school2 with same email
  - Verify different account

### Performance Validation

#### 1. Response Time Checks
- [ ] **Login API** `< 500ms`
  - Use browser DevTools Network tab
  - Measure `/api/auth/callback/credentials`
  - Target: < 500ms
  - Verify database query time

- [ ] **OAuth Callback** `< 1000ms`
  - Measure OAuth redirect time
  - Target: < 1000ms
  - Check for any slow operations

- [ ] **Token Generation** `< 200ms`
  - Measure verification token generation
  - Measure password reset token generation
  - Target: < 200ms

- [ ] **Email Sending** `< 2000ms`
  - Measure time to send verification email
  - Target: < 2 seconds
  - Check Resend API response time

#### 2. Load Testing (Optional for MVP)
- [ ] 100 concurrent logins
- [ ] 50 concurrent registrations
- [ ] Verify no errors under load
- [ ] Verify response times stable

### Security Validation

#### 1. SSL/TLS Configuration
- [ ] Access https://ed.databayt.org
- [ ] Verify SSL certificate valid
- [ ] Verify HTTPS redirects from HTTP
- [ ] Check SSL Labs rating (A+ target)
- [ ] Verify HSTS header present

#### 2. Cookie Security
- [ ] Inspect session cookie:
  - [ ] `httpOnly` flag set
  - [ ] `secure` flag set (production)
  - [ ] `sameSite=lax` set
  - [ ] Domain: `.databayt.org`
  - [ ] Expiry: 24 hours

#### 3. Security Headers
- [ ] Verify headers present:
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Content-Security-Policy`
  - [ ] `Referrer-Policy`
  - [ ] `Permissions-Policy`

#### 4. Rate Limiting Verification
- [ ] Make 6 rapid login attempts
- [ ] Verify rate limit kicks in
- [ ] Verify error message shown
- [ ] Wait 1 minute
- [ ] Verify rate limit resets

#### 5. Account Lockout Verification
- [ ] Enter wrong password 5 times
- [ ] Verify account locked
- [ ] Verify lockout email sent
- [ ] Verify error message clear
- [ ] Wait 15 minutes or manually unlock
- [ ] Verify can login again

### Error Monitoring

#### 1. Sentry Integration
- [ ] Verify Sentry receiving events
- [ ] Trigger test error
- [ ] Verify error appears in Sentry dashboard
- [ ] Set up error alerts
- [ ] Configure error grouping

#### 2. Log Analysis
- [ ] Check Vercel logs for auth errors
- [ ] Verify no sensitive data in logs
- [ ] Set up log retention policy
- [ ] Create log search queries for common issues

#### 3. Email Deliverability
- [ ] Check email bounce rate (< 2%)
- [ ] Check email open rate
- [ ] Verify emails not marked as spam
- [ ] Test with Gmail, Outlook, Yahoo

### Database Validation

#### 1. Schema Verification
- [ ] Run `pnpm prisma db pull` to verify schema
- [ ] Verify all migrations applied
- [ ] Check for any schema drift
- [ ] Verify indexes exist on key fields

#### 2. Data Integrity
- [ ] Verify no orphaned records
- [ ] Verify foreign key constraints working
- [ ] Verify multi-tenant uniqueness constraints
- [ ] Check for any data anomalies

#### 3. Query Performance
- [ ] Review slow query log
- [ ] Verify indexes used efficiently
- [ ] Check for N+1 query issues
- [ ] Optimize as needed

### User Experience Validation

#### 1. Error Messages
- [ ] Verify user-friendly error messages
- [ ] No technical jargon or stack traces
- [ ] Clear call-to-action on errors
- [ ] Helpful suggestions for resolution

#### 2. Email Templates
- [ ] Verify branding consistent
- [ ] Verify links work correctly
- [ ] Verify HTML renders properly
- [ ] Verify plain text fallback

#### 3. Mobile Responsiveness
- [ ] Test login on mobile
- [ ] Test registration on mobile
- [ ] Test OAuth on mobile
- [ ] Verify forms usable on small screens

### Rollback Preparation

#### 1. Rollback Plan
- [ ] Document rollback procedure
- [ ] Identify rollback trigger criteria
- [ ] Prepare rollback commands
- [ ] Test rollback in staging

#### 2. Backup Verification
- [ ] Verify database backup exists
- [ ] Verify backup restoration works
- [ ] Document backup retention policy
- [ ] Set up automated backups

---

## 🚨 Incident Response Plan

### Authentication Security Breach

#### Severity Levels

**Critical (P0):**
- Mass unauthorized access
- Database compromise
- OAuth provider compromise
- Session hijacking at scale

**High (P1):**
- Individual account takeover
- Password database leak
- Email verification bypass
- Rate limiting bypass

**Medium (P2):**
- Email enumeration exploit
- 2FA bypass
- Excessive failed logins
- Token expiry issues

**Low (P3):**
- UX issues
- Email delivery problems
- Non-critical errors

### Immediate Response (First 15 Minutes)

#### 1. Incident Detection
- [ ] **Source:** Sentry alert, user report, monitoring system
- [ ] **Verify:** Confirm incident is real, not false positive
- [ ] **Assess:** Determine severity level (P0-P3)
- [ ] **Notify:** Alert on-call engineer and security team

#### 2. Initial Containment
- [ ] **P0/P1:** Consider taking auth system offline temporarily
- [ ] **Access:** Review audit logs for affected accounts
- [ ] **Block:** Temporarily block suspicious IPs if needed
- [ ] **Isolate:** Identify compromised tenant(s) if multi-tenant issue

#### 3. Communication
- [ ] **Internal:** Notify leadership, engineering, security teams
- [ ] **External:** Prepare user communication if needed
- [ ] **Documentation:** Start incident timeline document

### Investigation (First Hour)

#### 1. Gather Information
- [ ] Review Sentry errors related to incident
- [ ] Check Vercel logs for suspicious activity
- [ ] Review database audit logs
- [ ] Check email delivery logs
- [ ] Review OAuth provider logs

#### 2. Identify Attack Vector
- [ ] **Check for:**
  - [ ] SQL injection attempts
  - [ ] XSS attacks
  - [ ] CSRF bypass
  - [ ] Rate limit bypass
  - [ ] OAuth misconfiguration
  - [ ] Session fixation
  - [ ] Brute force attacks
  - [ ] Token theft

#### 3. Assess Impact
- [ ] Number of affected users
- [ ] Types of data compromised
- [ ] Duration of exposure
- [ ] Scope of access gained
- [ ] Multi-tenant isolation breach?

### Remediation (First 4 Hours)

#### 1. Immediate Fixes
- [ ] **Deploy hotfix** for identified vulnerability
- [ ] **Rotate secrets:** AUTH_SECRET, API keys if needed
- [ ] **Invalidate sessions:** Force logout of affected users
- [ ] **Reset passwords:** Force reset for compromised accounts
- [ ] **Revoke tokens:** Clear all auth tokens if needed

#### 2. Enhanced Monitoring
- [ ] Increase logging verbosity
- [ ] Set up additional Sentry alerts
- [ ] Monitor for repeat attempts
- [ ] Track remediation effectiveness

#### 3. Database Actions
- [ ] **If password leak:**
  - [ ] Force password reset for all users
  - [ ] Update password policy
  - [ ] Notify users via email

- [ ] **If token compromise:**
  - [ ] Clear all VerificationToken records
  - [ ] Clear all PasswordResetToken records
  - [ ] Clear all TwoFactorToken records
  - [ ] Invalidate all sessions

### Recovery (First 24 Hours)

#### 1. Restore Service
- [ ] Deploy comprehensive fix
- [ ] Run security tests
- [ ] Verify vulnerability closed
- [ ] Monitor for stability
- [ ] Gradually restore traffic

#### 2. User Communication
- [ ] **Email affected users:**
  - What happened
  - What data was affected
  - Actions taken
  - Steps users should take
  - How to contact support

- [ ] **Public disclosure (if required):**
  - Incident summary
  - Timeline
  - Impact assessment
  - Remediation steps
  - Prevention measures

#### 3. Data Cleanup
- [ ] Remove any malicious data
- [ ] Restore from backup if needed
- [ ] Verify data integrity
- [ ] Re-run validations

### Post-Incident (First Week)

#### 1. Root Cause Analysis
- [ ] **Document:**
  - What happened
  - Why it happened
  - How it was detected
  - How it was resolved
  - What was the impact

- [ ] **Identify gaps:**
  - Code review failures
  - Test coverage gaps
  - Monitoring blind spots
  - Process failures

#### 2. Preventive Measures
- [ ] **Code changes:**
  - Add missing validations
  - Strengthen security measures
  - Add defensive programming
  - Update dependencies

- [ ] **Testing:**
  - Add security tests
  - Add penetration tests
  - Increase coverage
  - Automate security scans

- [ ] **Monitoring:**
  - Add new alerts
  - Improve detection
  - Add audit logging
  - Set up anomaly detection

#### 3. Process Improvements
- [ ] Update security guidelines
- [ ] Improve code review process
- [ ] Add security training
- [ ] Update incident response plan

### Specific Breach Scenarios

#### Mass Password Compromise
1. **Immediate:** Force logout all users
2. **Action:** Require password reset for all
3. **Communication:** Email all users within 1 hour
4. **Investigation:** Check for password hash leak
5. **Prevention:** Upgrade bcrypt rounds, add rate limits

#### OAuth Token Theft
1. **Immediate:** Revoke all OAuth tokens
2. **Action:** Contact OAuth providers (Google, Facebook)
3. **Communication:** Notify affected users
4. **Investigation:** Check for token interception
5. **Prevention:** Re-enable PKCE, rotate client secrets

#### Session Hijacking
1. **Immediate:** Invalidate all sessions
2. **Action:** Force re-authentication
3. **Communication:** Notify affected users
4. **Investigation:** Check for session fixation/XSS
5. **Prevention:** Rotate session secrets, strengthen CSP

#### Email Verification Bypass
1. **Immediate:** Block unverified logins
2. **Action:** Audit all recently created accounts
3. **Communication:** Internal team only
4. **Investigation:** Check verification logic
5. **Prevention:** Enforce email verification, add tests

#### Multi-Tenant Isolation Breach
1. **Immediate:** Identify affected tenants
2. **Action:** Audit cross-tenant access attempts
3. **Communication:** Notify affected schools
4. **Investigation:** Check all schoolId queries
5. **Prevention:** Add middleware-level tenant checks

### Contact Information

**On-Call Engineer:**
- Primary: [Phone/Slack]
- Secondary: [Phone/Slack]

**Security Team:**
- Email: security@databayt.org
- Slack: #security-alerts

**External Contacts:**
- Google OAuth Support: [Link]
- Facebook Developer Support: [Link]
- Resend Support: [Email]
- Vercel Support: [Link]

### Incident Log Template
```markdown
# Incident Report: [Brief Description]

**Date:** [YYYY-MM-DD]
**Severity:** [P0/P1/P2/P3]
**Status:** [Investigating/Mitigating/Resolved]

## Timeline
- **HH:MM** - Incident detected
- **HH:MM** - Initial response started
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed
- **HH:MM** - Incident resolved

## Impact
- **Users affected:** [Number]
- **Data compromised:** [Description]
- **Duration:** [Time]

## Root Cause
[Detailed explanation]

## Resolution
[What was done to fix]

## Prevention
[What will be done to prevent recurrence]

## Action Items
- [ ] [Action 1]
- [ ] [Action 2]
```

---

## 📝 Known Issues & Workarounds

**Reference:** `src/components/auth/ISSUE.md`

### 1. PKCE Disabled for OAuth (CRITICAL)
- **Status:** 🔴 Active
- **Severity:** Critical
- **Description:** PKCE (Proof Key for Code Exchange) disabled for both Google and Facebook OAuth
- **Location:** `src/auth.config.ts:42-43, 63-64`
- **Code:**
  ```typescript
  checks: [], // Disable PKCE temporarily
  ```
- **Impact:** Vulnerable to authorization code interception attacks
- **Workaround:** None - MUST be fixed before production
- **Fix:** Remove `checks: []` to re-enable PKCE
- **Timeline:** Fix in Week 1 Critical Fixes

### 2. Google OAuth redirect_uri_mismatch (RESOLVED)
- **Status:** ✅ Resolved
- **Reference:** ISSUE.md lines 47-53
- **Description:** Google OAuth failed with redirect URI mismatch error
- **Cause:** Redirect URI in Google Console didn't match actual callback URL
- **Fix:** Updated Google Console to include all redirect URIs:
  - Production: `https://ed.databayt.org/api/auth/callback/google`
  - Development: `http://localhost:3000/api/auth/callback/google`
  - Subdomains: `https://*.databayt.org/api/auth/callback/google`

### 3. Facebook OAuth 500 Error (RESOLVED)
- **Status:** ✅ Resolved
- **Reference:** ISSUE.md lines 54-64
- **Description:** Facebook OAuth returned 500 error on callback
- **Cause:** Facebook's `#_=_` hash in callback URL breaking redirect logic
- **Fix:** Added hash cleanup in `src/components/auth/social.tsx:110-145`
- **Code:**
  ```typescript
  if (url.includes('#_=_')) {
    url = url.replace(/#.*$/, '');
  }
  ```

### 4. Weak Password Policy (ACTIVE)
- **Status:** 🔴 Active
- **Severity:** High
- **Description:** Password minimum length only 6 characters
- **Location:** `src/components/auth/validation.ts`
- **Impact:** Vulnerable to brute force attacks
- **Workaround:** Educate users to choose strong passwords
- **Fix:** Update to 12+ characters with complexity requirements
- **Timeline:** Fix in Week 1 Critical Fixes

### 5. No Rate Limiting on Auth Endpoints (ACTIVE)
- **Status:** 🔴 Active
- **Severity:** Critical
- **Description:** No rate limiting applied to login, register, reset actions
- **Location:** `src/components/auth/*/action.ts`
- **Impact:** Vulnerable to brute force, credential stuffing
- **Workaround:** Monitor for suspicious activity manually
- **Fix:** Apply existing rate limit infrastructure from `src/lib/rate-limit.ts`
- **Timeline:** Fix in Week 1 Critical Fixes

### 6. Email Verification Not Enforced (ACTIVE)
- **Status:** 🟠 Active
- **Severity:** Medium
- **Description:** Users can login without verifying email
- **Location:** `src/components/auth/login/action.ts:33-44`
- **Current Behavior:** Sends another verification email but allows login
- **Impact:** Account takeover via email enumeration
- **Workaround:** Monitor unverified accounts
- **Fix:** Block login until email verified
- **Timeline:** Fix in Week 2 High Priority

### 7. Weak 2FA Token Generation (ACTIVE)
- **Status:** 🟠 Active
- **Severity:** Medium
- **Description:** 2FA tokens only 6 digits with limited randomness
- **Location:** `src/components/auth/tokens.ts:11`
- **Current:** `crypto.randomInt(100_000, 1_000_000)`
- **Impact:** ~900,000 possible values, vulnerable to brute force
- **Workaround:** 5-minute expiry mitigates risk
- **Fix:** Use cryptographically secure random with more entropy
- **Timeline:** Fix in Week 2 High Priority

### 8. Token Cleanup with setTimeout (ACTIVE)
- **Status:** 🟡 Active
- **Severity:** Low
- **Description:** Token deletion uses `setTimeout` (unreliable in serverless)
- **Location:** `src/components/auth/verification/action.ts:57-62`
- **Impact:** Tokens may not be deleted if server terminates
- **Workaround:** Manual database cleanup periodically
- **Fix:** Delete immediately or use background job queue
- **Timeline:** Fix in Week 3 Polish

### 9. Zero Test Coverage (ACTIVE)
- **Status:** 🔴 Active
- **Severity:** Critical
- **Description:** No unit, integration, or E2E tests for auth
- **Impact:** Regressions not caught, hard to refactor safely
- **Workaround:** Manual testing before deploys
- **Fix:** Add comprehensive test suite (50+ tests)
- **Timeline:** Fix in Week 2 Testing Foundation

### 10. Excessive Console Logging (ACTIVE)
- **Status:** 🟠 Active
- **Severity:** Medium
- **Description:** 100+ console.log statements in production code
- **Locations:** `src/auth.ts`, `src/components/auth/social.tsx`, etc.
- **Impact:** Performance, log pollution, potential info disclosure
- **Workaround:** Ignore in production
- **Fix:** Conditional logging or proper logger
- **Timeline:** Fix in Week 1 Critical Fixes

### 11. No Account Lockout (ACTIVE)
- **Status:** 🔴 Active
- **Severity:** Critical
- **Description:** No limit on failed login attempts
- **Impact:** Unlimited brute force attempts possible
- **Workaround:** Monitor for suspicious patterns
- **Fix:** Lock account after 5 failed attempts for 15 minutes
- **Timeline:** Fix in Week 1 Critical Fixes

### 12. No 2FA Backup Codes (ACTIVE)
- **Status:** 🟡 Active
- **Severity:** Low
- **Description:** No backup codes for 2FA recovery
- **Impact:** User locked out if loses 2FA device
- **Workaround:** Manual account recovery via support
- **Fix:** Generate 10 single-use backup codes
- **Timeline:** Fix in Week 3 Enhancements

### 13. No Session Management UI (ACTIVE)
- **Status:** 🟡 Active
- **Severity:** Medium
- **Description:** Users can't view or manage active sessions
- **Impact:** Can't revoke compromised sessions
- **Workaround:** Change password to invalidate sessions
- **Fix:** Add sessions page with revoke functionality
- **Timeline:** Fix in Week 2 High Priority

### 14. Complex OAuth Redirect Logic (ACTIVE)
- **Status:** 🟡 Active
- **Severity:** Low (maintainability issue)
- **Description:** OAuth redirect callback is 700+ lines
- **Location:** `src/auth.ts:336-1034`
- **Impact:** Hard to maintain, test, debug
- **Workaround:** Extensive logging helps debugging
- **Fix:** Refactor into smaller functions
- **Timeline:** Fix in Week 4 Refactoring

---

## 🚀 Future Enhancements

### Short-Term (Next 2 Months)

#### 1. Additional OAuth Providers
- [ ] **GitHub OAuth** (popular with developers)
- [ ] **Apple Sign In** (iOS users)
- [ ] **Microsoft/Azure AD** (enterprise users)
- [ ] **Twitter OAuth** (social media)

#### 2. Advanced 2FA
- [ ] **Authenticator app support** (Google Authenticator, Authy)
- [ ] **SMS 2FA** (via Twilio)
- [ ] **Backup codes** (10 single-use codes)
- [ ] **Trusted devices** (skip 2FA for 30 days)
- [ ] **2FA recovery flow** (if device lost)

#### 3. Session Management
- [ ] **Active sessions dashboard** (`/settings/sessions`)
- [ ] **Device information** (browser, OS, location)
- [ ] **Revoke individual session**
- [ ] **Logout all devices**
- [ ] **Session history** (last 30 days)

#### 4. Security Enhancements
- [ ] **Password strength meter** during registration
- [ ] **Compromised password check** (haveibeenpwned API)
- [ ] **Login notifications** (email on new device)
- [ ] **Suspicious activity alerts**
- [ ] **Geolocation-based security** (new location alert)

#### 5. User Experience
- [ ] **"Remember me" functionality** (extend session)
- [ ] **Session expiration warnings** (5 min before expiry)
- [ ] **Auto-login after verification**
- [ ] **Social account linking UI** (connect OAuth + credentials)
- [ ] **Account deletion flow** (GDPR compliance)

### Medium-Term (Next 6 Months)

#### 1. Enterprise Features
- [ ] **SSO/SAML integration** (for enterprise customers)
- [ ] **Active Directory integration**
- [ ] **Okta integration**
- [ ] **Custom OAuth providers** (per tenant)
- [ ] **Domain-restricted signups** (e.g., only @school.edu)

#### 2. Advanced Security
- [ ] **WebAuthn/Passkeys** (biometric authentication)
- [ ] **Device fingerprinting** (detect suspicious devices)
- [ ] **IP whitelisting** (restrict access by IP)
- [ ] **Geofencing** (restrict access by location)
- [ ] **Adaptive authentication** (risk-based challenges)

#### 3. Compliance & Auditing
- [ ] **Complete audit log** (all auth events)
- [ ] **GDPR data export** (user's auth data)
- [ ] **GDPR data deletion** (right to be forgotten)
- [ ] **SOC 2 compliance** preparation
- [ ] **Security questionnaire** automation

#### 4. Performance Optimization
- [ ] **OAuth token refresh** (automatic refresh)
- [ ] **Session caching** (Redis for faster lookups)
- [ ] **Rate limiting with Redis** (distributed rate limits)
- [ ] **Database connection pooling** optimization
- [ ] **Query optimization** (auth lookups)

#### 5. Developer Experience
- [ ] **Auth testing utilities** (mock auth, test users)
- [ ] **Auth debugging tools** (inspect session, tokens)
- [ ] **Local auth dev mode** (bypass OAuth locally)
- [ ] **Auth playground** (test flows in sandbox)
- [ ] **Auth SDK** (for mobile apps)

### Long-Term (Next Year)

#### 1. Multi-Factor Authentication
- [ ] **Hardware security keys** (YubiKey, etc.)
- [ ] **Biometric authentication** (Face ID, Touch ID)
- [ ] **Push notifications** for 2FA approval
- [ ] **Time-based one-time passwords** (TOTP)
- [ ] **Location-based authentication**

#### 2. Passwordless Authentication
- [ ] **Magic links** (email-based login)
- [ ] **SMS-based login**
- [ ] **WebAuthn only** (no password required)
- [ ] **Passkey support** (iOS, Android)

#### 3. Identity Verification
- [ ] **ID document verification** (passport, driver's license)
- [ ] **Selfie verification** (liveness check)
- [ ] **Phone number verification**
- [ ] **Address verification**
- [ ] **KYC (Know Your Customer)** integration

#### 4. Admin & Management
- [ ] **User management dashboard** (admin panel)
- [ ] **Bulk user operations** (import, export, suspend)
- [ ] **Role management UI** (create, edit, assign roles)
- [ ] **Permission management** (granular permissions)
- [ ] **Impersonation logging** (audit admin actions)

#### 5. Analytics & Insights
- [ ] **Auth analytics dashboard**
  - Login success/failure rates
  - Registration funnel analysis
  - OAuth provider adoption
  - 2FA enrollment rate
  - Geographic distribution
- [ ] **Security insights**
  - Failed login trends
  - Account lockout frequency
  - Suspicious activity patterns
  - Compromised account detection

#### 6. Mobile & API
- [ ] **Mobile app SDK** (React Native, Flutter)
- [ ] **Refresh token rotation** (enhanced security)
- [ ] **API key authentication** (for machine-to-machine)
- [ ] **OAuth device flow** (for CLI/IoT devices)
- [ ] **GraphQL authentication** (if adopting GraphQL)

---

## 📈 Success Metrics & KPIs

### Auth Performance Metrics

**Target Metrics (First Month):**
- Login success rate: **>95%**
- Registration completion rate: **>80%**
- Email verification rate: **>70%**
- OAuth success rate (Google): **>90%**
- OAuth success rate (Facebook): **>85%**
- 2FA enrollment rate: **>20%** (of eligible users)
- Password reset completion rate: **>60%**

**Response Time Targets:**
- Login API: **< 500ms** (p95)
- Registration API: **< 800ms** (p95)
- OAuth callback: **< 1000ms** (p95)
- Email sending: **< 2000ms** (p95)

**Security Metrics:**
- Failed login rate: **< 5%**
- Account lockout rate: **< 1%**
- Rate limit hits: **< 0.5%**
- Security incidents: **0** (critical)

### Implementation Progress

**Week 1 Goals:**
- [ ] 5/5 critical fixes completed
- [ ] PKCE re-enabled
- [ ] Rate limiting applied
- [ ] Password policy strengthened
- [ ] Account lockout implemented

**Week 2 Goals:**
- [ ] Test coverage: **50%+**
- [ ] Email verification enforced
- [ ] Security logging implemented
- [ ] Sentry integration complete

**Week 3 Goals:**
- [ ] Test coverage: **80%+**
- [ ] Session management UI complete
- [ ] Cross-tenant audit passed
- [ ] Production deployment successful

**Week 4 Goals:**
- [ ] Test coverage: **85%+**
- [ ] Documentation complete
- [ ] Incident response plan tested
- [ ] Post-launch monitoring stable

---

## ✅ Checklist Summary

### Critical Priorities (Week 1)
- [ ] Re-enable PKCE for OAuth
- [ ] Apply rate limiting to auth actions
- [ ] Strengthen password policy (6 → 12+ chars)
- [ ] Implement account lockout
- [ ] Remove production console.log
- [ ] Add basic test suite (50%+ coverage)

### High Priorities (Week 2-3)
- [ ] Enforce email verification
- [ ] Implement session management UI
- [ ] Add security event logging
- [ ] Set up Sentry monitoring
- [ ] Add comprehensive tests (80%+ coverage)
- [ ] Cross-tenant security audit
- [ ] Add account recovery mechanisms

### Production Deployment
- [ ] Environment variables configured
- [ ] OAuth providers configured
- [ ] Email service configured
- [ ] Database migrations run
- [ ] Security hardening complete
- [ ] All tests passing
- [ ] Smoke tests complete
- [ ] Monitoring active

### Post-Deployment
- [ ] Monitor key metrics
- [ ] Review error rates
- [ ] Check user feedback
- [ ] Verify security measures working
- [ ] Document any issues

---

**Document Version:** 1.0
**Last Review:** 2025-01-14
**Next Review:** After Week 1 Critical Fixes
**Owner:** Engineering Team
**Status:** Active - Use for production readiness tracking
