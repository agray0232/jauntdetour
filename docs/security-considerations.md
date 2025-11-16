# Security Considerations for Authentication

## Overview

This document provides detailed security considerations for implementing authentication in Jauntdetour. These guidelines ensure the application follows security best practices and protects user data.

---

## Authentication Protocol

### OAuth 2.0 + OpenID Connect

**Recommended Flow**: Authorization Code Flow with PKCE (Proof Key for Code Exchange)

#### Why PKCE?
- Prevents authorization code interception attacks
- Secure for public clients (SPAs, mobile apps)
- Required by OAuth 2.0 best practices for browser-based apps
- Mitigates the need for client secrets in frontend applications

#### Flow Diagram
```
┌──────────┐                                  ┌──────────────┐
│          │                                  │              │
│  User    │                                  │   Azure AD   │
│          │                                  │     B2C      │
└────┬─────┘                                  └──────┬───────┘
     │                                               │
     │  1. Initiate Login (with code_challenge)     │
     ├──────────────────────────────────────────────>│
     │                                               │
     │  2. User Authentication                       │
     │<─────────────────────────────────────────────>│
     │                                               │
     │  3. Authorization Code                        │
     │<──────────────────────────────────────────────┤
     │                                               │
     │  4. Exchange Code (with code_verifier)        │
     ├──────────────────────────────────────────────>│
     │                                               │
     │  5. Access Token + Refresh Token              │
     │<──────────────────────────────────────────────┤
     │                                               │
```

---

## Token Management

### Access Tokens

**Storage**: Memory (React State/Context)
**Lifetime**: 15-60 minutes
**Purpose**: API authorization

#### Best Practices
```javascript
// ✅ GOOD: Store in memory
const [accessToken, setAccessToken] = useState(null);

// ❌ BAD: Don't store in localStorage
localStorage.setItem('accessToken', token); // Vulnerable to XSS

// ❌ BAD: Don't store in sessionStorage
sessionStorage.setItem('accessToken', token); // Vulnerable to XSS
```

#### Token Claims Validation
```javascript
function validateAccessToken(token) {
  const decoded = jwt.decode(token);
  
  // Validate expiration
  if (decoded.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }
  
  // Validate audience
  if (decoded.aud !== process.env.AZURE_AD_CLIENT_ID) {
    throw new Error('Invalid audience');
  }
  
  // Validate issuer
  const expectedIssuer = `https://${process.env.AZURE_AD_TENANT}.b2clogin.com/${process.env.AZURE_AD_TENANT}.onmicrosoft.com/v2.0/`;
  if (decoded.iss !== expectedIssuer) {
    throw new Error('Invalid issuer');
  }
  
  return decoded;
}
```

---

### Refresh Tokens

**Storage**: HttpOnly Secure Cookies (backend-managed)
**Lifetime**: 7-30 days
**Purpose**: Obtain new access tokens

#### Cookie Configuration
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,           // Not accessible via JavaScript
  secure: true,             // HTTPS only
  sameSite: 'strict',       // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',        // Limit scope
  domain: process.env.DOMAIN // Explicit domain
});
```

#### Token Rotation
Always issue a new refresh token when using the old one:

```javascript
async function refreshAccessToken(oldRefreshToken) {
  // Validate old refresh token
  const session = await validateRefreshToken(oldRefreshToken);
  
  // Get new tokens from Azure AD B2C
  const newTokens = await azureB2C.refreshTokens(oldRefreshToken);
  
  // Invalidate old refresh token
  await revokeRefreshToken(oldRefreshToken);
  
  // Store new refresh token
  await storeRefreshToken(newTokens.refreshToken, session.userId);
  
  return newTokens;
}
```

---

## Transport Security

### HTTPS Configuration

**Requirement**: All authentication endpoints must use HTTPS

#### Express.js Configuration
```javascript
const express = require('express');
const helmet = require('helmet');
const app = express();

// Security headers
app.use(helmet());

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// HSTS - Force HTTPS for 1 year
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

#### Certificate Recommendations
- Use Let's Encrypt for free SSL certificates
- Use TLS 1.2 or higher
- Disable TLS 1.0 and 1.1
- Use strong cipher suites

---

## Cross-Site Request Forgery (CSRF) Protection

### SameSite Cookies
First line of defense against CSRF:

```javascript
res.cookie('refreshToken', token, {
  sameSite: 'strict' // or 'lax' for some cross-site scenarios
});
```

### Anti-CSRF Tokens
For additional protection on state-changing operations:

```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply to state-changing endpoints
app.post('/api/user/profile', csrfProtection, updateProfile);
app.delete('/api/user/account', csrfProtection, deleteAccount);

// Send CSRF token to client
app.get('/api/auth/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

Frontend implementation:
```javascript
// Get CSRF token
const response = await fetch('/api/auth/csrf-token', {
  credentials: 'include'
});
const { csrfToken } = await response.json();

// Include in POST request
await fetch('/api/user/profile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify(profileData)
});
```

---

## Cross-Origin Resource Sharing (CORS)

### Configuration

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.FRONTEND_URL, // e.g., 'https://jauntdetour.com'
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### Security Considerations
- **Never** use `origin: '*'` with `credentials: true`
- Whitelist specific origins
- Validate origin header on the server
- Use `credentials: true` only when necessary

---

## Rate Limiting

### Login Rate Limiting

Prevent brute force attacks:

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

### Token Refresh Rate Limiting

```javascript
const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 refresh attempts per minute
  message: 'Too many refresh requests'
});

app.post('/api/auth/refresh', refreshLimiter, refreshHandler);
```

### IP-Based Rate Limiting

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api', limiter);
```

---

## Password Security (if using email/password)

### Password Requirements

```javascript
const passwordValidator = require('password-validator');

const schema = new passwordValidator();

schema
  .is().min(12)                                   // Minimum length 12
  .is().max(128)                                  // Maximum length 128
  .has().uppercase()                              // Must have uppercase
  .has().lowercase()                              // Must have lowercase
  .has().digits()                                 // Must have digits
  .has().symbols()                                // Must have symbols
  .has().not().spaces()                           // Should not have spaces
  .is().not().oneOf(['Password123!', 'Admin123!']); // Blacklist common passwords

function validatePassword(password) {
  return schema.validate(password, { list: true });
}
```

### Password Hashing

Azure AD B2C handles password hashing, but for custom implementations:

```javascript
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

### Password Breach Detection

Check against known breached passwords using Have I Been Pwned API:

```javascript
const crypto = require('crypto');
const axios = require('axios');

async function isPasswordPwned(password) {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.substring(0, 5);
  const suffix = sha1.substring(5);
  
  const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
  const hashes = response.data.split('\n');
  
  for (const hash of hashes) {
    const [hashSuffix, count] = hash.split(':');
    if (hashSuffix === suffix) {
      return parseInt(count, 10);
    }
  }
  
  return 0;
}
```

---

## Multi-Factor Authentication (MFA)

### MFA Enforcement

**Recommendations**:
- Optional for regular users
- Required for admin accounts
- Required for sensitive operations (account deletion, payment)

### Azure AD B2C MFA Configuration

Azure AD B2C supports:
- SMS-based verification
- Email verification
- Authenticator app (TOTP)
- Phone call verification

```javascript
// Check if MFA is enabled for user
function requireMFA(req, res, next) {
  if (!req.user.mfaEnabled && req.user.roles.includes('admin')) {
    return res.status(403).json({
      error: 'MFA required for admin accounts',
      setupUrl: '/account/security/mfa'
    });
  }
  next();
}

app.post('/api/admin/*', requireMFA, adminHandler);
```

---

## Session Security

### Session Timeout

**Idle Timeout**: 30 minutes
**Absolute Timeout**: 12 hours

```javascript
const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_ABSOLUTE_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours

async function validateSession(sessionId) {
  const session = await redis.get(`session:${sessionId}`);
  if (!session) return null;
  
  const sessionData = JSON.parse(session);
  const now = Date.now();
  
  // Check absolute timeout
  if (now - sessionData.createdAt > SESSION_ABSOLUTE_TIMEOUT) {
    await redis.del(`session:${sessionId}`);
    return null;
  }
  
  // Check idle timeout
  if (now - sessionData.lastActivity > SESSION_IDLE_TIMEOUT) {
    await redis.del(`session:${sessionId}`);
    return null;
  }
  
  // Update last activity
  sessionData.lastActivity = now;
  await redis.set(`session:${sessionId}`, JSON.stringify(sessionData));
  
  return sessionData;
}
```

### Session Revocation

**Scenarios requiring session revocation**:
- User logout
- Password change
- Account deletion
- Security incident
- Admin action

```javascript
async function revokeAllUserSessions(userId) {
  const sessionKeys = await redis.keys(`session:${userId}:*`);
  if (sessionKeys.length > 0) {
    await redis.del(...sessionKeys);
  }
  
  // Optional: Add to revocation list
  await redis.sadd('revoked_users', userId);
  await redis.expire('revoked_users', 24 * 60 * 60); // 24 hours
}

// Middleware to check revocation
async function checkRevocation(req, res, next) {
  const isRevoked = await redis.sismember('revoked_users', req.user.id);
  if (isRevoked) {
    return res.status(401).json({ error: 'Session revoked' });
  }
  next();
}
```

---

## Input Validation

### JWT Token Validation

```javascript
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const jwksClient = jwksRsa({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri: `https://${process.env.AZURE_AD_TENANT}.b2clogin.com/${process.env.AZURE_AD_TENANT}.onmicrosoft.com/discovery/v2.0/keys?p=${process.env.AZURE_AD_POLICY}`
});

function getSigningKey(header, callback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function validateToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSigningKey, {
      audience: process.env.AZURE_AD_CLIENT_ID,
      issuer: `https://${process.env.AZURE_AD_TENANT}.b2clogin.com/${process.env.AZURE_AD_TENANT}.onmicrosoft.com/v2.0/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}
```

### Request Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 12 })
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Proceed with login
  }
);
```

---

## Logging and Monitoring

### Security Event Logging

**Events to log**:
- Login attempts (success/failure)
- Token refresh
- Session creation/destruction
- Password changes
- Account deletion
- MFA enrollment/usage
- Failed authorization attempts
- Suspicious activity

```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth' },
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

function logSecurityEvent(event, userId, details) {
  securityLogger.info({
    timestamp: new Date().toISOString(),
    event,
    userId,
    ip: details.ip,
    userAgent: details.userAgent,
    ...details
  });
}

// Usage
logSecurityEvent('login_success', user.id, {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  method: 'email'
});
```

### Anomaly Detection

```javascript
async function detectAnomalies(userId, loginData) {
  const recentLogins = await getRecentLogins(userId, 10);
  
  // Check for unusual location
  const locations = recentLogins.map(l => l.country);
  if (!locations.includes(loginData.country) && locations.length > 0) {
    await alertUnusualLocation(userId, loginData);
  }
  
  // Check for unusual device
  const devices = recentLogins.map(l => l.deviceId);
  if (!devices.includes(loginData.deviceId) && devices.length > 0) {
    await alertNewDevice(userId, loginData);
  }
  
  // Check for impossible travel
  const lastLogin = recentLogins[0];
  if (lastLogin && isImpossibleTravel(lastLogin, loginData)) {
    await alertImpossibleTravel(userId, loginData);
  }
}
```

---

## Security Headers

### Recommended Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.b2clogin.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Additional custom headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=()');
  next();
});
```

---

## Vulnerability Prevention

### XSS (Cross-Site Scripting) Prevention

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeInput(dirty) {
  return DOMPurify.sanitize(dirty);
}

// Use in API endpoints
app.post('/api/user/profile', async (req, res) => {
  const displayName = sanitizeInput(req.body.displayName);
  await updateUserProfile(req.user.id, { displayName });
  res.json({ success: true });
});
```

### SQL Injection Prevention

Use parameterized queries:

```javascript
// ✅ GOOD: Parameterized query
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ BAD: String concatenation
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### NoSQL Injection Prevention

```javascript
const validator = require('validator');

function validateMongoId(id) {
  if (!validator.isMongoId(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
}

// Sanitize input
function sanitizeMongoInput(input) {
  if (typeof input === 'object') {
    Object.keys(input).forEach(key => {
      if (key.startsWith('$')) {
        delete input[key];
      }
    });
  }
  return input;
}
```

---

## Incident Response

### Security Incident Playbook

1. **Detection**: Automated alerts or manual discovery
2. **Assessment**: Determine scope and severity
3. **Containment**: Prevent further damage
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

### Automated Response Actions

```javascript
async function respondToSecurityIncident(incident) {
  switch (incident.type) {
    case 'brute_force':
      // Block IP address
      await blockIP(incident.ip, 24 * 60 * 60); // 24 hours
      break;
      
    case 'compromised_account':
      // Revoke all sessions
      await revokeAllUserSessions(incident.userId);
      // Force password reset
      await forcePasswordReset(incident.userId);
      // Send security alert email
      await sendSecurityAlert(incident.userId, incident);
      break;
      
    case 'suspicious_activity':
      // Require MFA for next login
      await requireMFANextLogin(incident.userId);
      // Log for investigation
      await logSecurityEvent('suspicious_activity', incident);
      break;
  }
}
```

---

## Security Testing

### Regular Security Assessments

1. **Dependency Scanning**: Check for vulnerable packages
2. **Static Analysis**: CodeQL, SonarQube
3. **Dynamic Analysis**: OWASP ZAP, Burp Suite
4. **Penetration Testing**: Annual third-party testing

### Automated Security Checks

```javascript
// npm audit
npm audit --production

// Check for outdated packages
npm outdated

// OWASP Dependency Check
npm install -g dependency-check
dependency-check --project jauntdetour --scan .
```

---

## Checklist

### Pre-Deployment Security Checklist

- [ ] All traffic uses HTTPS
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Token validation implemented
- [ ] Rate limiting on authentication endpoints
- [ ] Session timeout configured
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention
- [ ] XSS prevention measures
- [ ] Password policy enforced (if applicable)
- [ ] MFA available for users
- [ ] Logging and monitoring configured
- [ ] Security incident response plan documented
- [ ] Dependencies up to date and scanned for vulnerabilities
- [ ] Secrets stored in environment variables (not in code)
- [ ] Regular security audit scheduled

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [Azure AD B2C Security](https://docs.microsoft.com/en-us/azure/active-directory-b2c/security-overview)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
