# Authentication Architecture - Quick Reference

## Recommendation Summary

**Selected Solution**: Azure AD B2C

**Key Reasons**:
- ✅ Azure ecosystem integration (already using ACR)
- ✅ $0 cost for first 50,000 monthly active users
- ✅ Enterprise-grade security and GDPR compliance
- ✅ Full feature set (social login, MFA, custom flows)
- ✅ 99.9% SLA and global scale

---

## Cost Comparison (First 50K Users)

| Solution | Annual Cost | Notes |
|----------|-------------|-------|
| **Azure AD B2C** ✅ | **$0** | Recommended |
| Firebase Auth | $0 | Not Azure-aligned |
| Auth0 | $1,995+ | Expensive at scale |
| Custom JWT | $19,000+ | High dev/maintenance cost |

---

## Security Highlights

### Token Storage
- **Access Token**: Memory (React state) - 15-60 min lifetime
- **Refresh Token**: HttpOnly cookie - 7-30 day lifetime

### Authentication Flow
- **Protocol**: OAuth 2.0 + OpenID Connect
- **Flow**: Authorization Code with PKCE
- **Session**: Hybrid (token-based + backend validation)

### Key Security Features
- HTTPS everywhere
- CSRF protection (SameSite cookies)
- Rate limiting on auth endpoints
- XSS prevention (no token in localStorage)
- MFA support
- Token rotation
- Session revocation

---

## GDPR Compliance

### Built-in Features (Azure AD B2C)
- ✅ Data residency options (EU/US/Asia)
- ✅ Data Processing Agreement included
- ✅ Encryption at rest and in transit
- ✅ Audit logging
- ✅ SOC 2, ISO 27001 certified

### Application Requirements
- [ ] Privacy policy
- [ ] Cookie consent banner
- [ ] Data export endpoint (`/api/user/export`)
- [ ] Account deletion endpoint (`/api/user/account`)
- [ ] Data retention policy (30-90 days)
- [ ] Audit logging

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Azure AD B2C tenant setup
- User flows configuration
- Backend integration (MSAL Node)
- Frontend integration (MSAL React)
- Basic login/logout

### Phase 2: Enhanced Features (Week 3-4)
- Social login (Google, Facebook)
- Redis session store
- Token refresh logic
- User profile management

### Phase 3: Security & Compliance (Week 5-6)
- Rate limiting
- CSRF protection
- GDPR compliance features
- Security monitoring

### Phase 4: Testing & Deployment (Week 7-8)
- Comprehensive testing
- Documentation
- Production deployment

**Total Timeline**: 8 weeks

---

## Quick Start Checklist

### Azure Setup
- [ ] Create Azure AD B2C tenant
- [ ] Register application
- [ ] Configure user flows (signup, signin, password reset)
- [ ] Set up redirect URIs
- [ ] Configure social identity providers (optional)

### Backend Setup
- [ ] Install dependencies (`@azure/msal-node`, `jsonwebtoken`, `jwks-rsa`)
- [ ] Configure environment variables
- [ ] Create token validation middleware
- [ ] Set up auth routes
- [ ] Configure CORS and cookies

### Frontend Setup
- [ ] Install dependencies (`@azure/msal-browser`, `@azure/msal-react`)
- [ ] Configure MSAL
- [ ] Create auth context
- [ ] Implement protected routes
- [ ] Create login/logout components

### Testing
- [ ] Test signup flow
- [ ] Test signin flow
- [ ] Test social login
- [ ] Test token refresh
- [ ] Test logout
- [ ] Test protected routes

---

## Environment Variables

### Backend (.env)
```bash
AZURE_AD_B2C_TENANT_NAME=jauntdetour
AZURE_AD_B2C_CLIENT_ID=<client-id>
AZURE_AD_B2C_DOMAIN=jauntdetour.b2clogin.com
AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY=B2C_1_signupsignin
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
SESSION_SECRET=<strong-secret>
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### Frontend (.env)
```bash
REACT_APP_AZURE_AD_CLIENT_ID=<client-id>
REACT_APP_AZURE_AD_TENANT_NAME=jauntdetour
REACT_APP_AZURE_AD_DOMAIN=jauntdetour.b2clogin.com
REACT_APP_AZURE_AD_POLICY=B2C_1_signupsignin
REACT_APP_API_URL=http://localhost:3000
```

---

## Key Code Snippets

### Backend: Token Validation Middleware
```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

function validateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  jwt.verify(token, getSigningKey, {
    audience: process.env.AZURE_AD_B2C_CLIENT_ID,
    issuer: `https://${process.env.AZURE_AD_B2C_DOMAIN}/...`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
}
```

### Frontend: Auth Context
```javascript
const { instance, accounts } = useMsal();

const login = async () => {
  await instance.loginRedirect(loginRequest);
};

const logout = async () => {
  await instance.logoutRedirect();
};
```

### Protected API Call
```javascript
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include'
});
```

---

## Comparison Matrix

| Feature | Azure AD B2C | Auth0 | Firebase | Custom JWT |
|---------|--------------|-------|----------|------------|
| Azure Integration | ✅ Native | ❌ Third-party | ❌ Google | ✅ Custom |
| Cost (50K users) | ✅ $0 | ❌ $1,995+ | ✅ $0 | ❌ $19K+ |
| Social Login | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Build |
| MFA | ✅ Built-in | ✅ Built-in | ⚠️ Limited | ❌ Build |
| GDPR | ✅ Compliant | ✅ Compliant | ⚠️ Config | ❌ Build |
| Customization | ✅ High | ✅ High | ⚠️ Medium | ✅ Unlimited |
| Dev Time | ⚠️ 2-3 weeks | ✅ 1-2 weeks | ✅ 1 week | ❌ 6-8 weeks |
| Maintenance | ✅ Minimal | ✅ Minimal | ✅ Minimal | ❌ High |
| Scalability | ✅ Millions | ✅ Millions | ✅ Millions | ⚠️ Custom |
| Support | ✅ Enterprise | ✅ Enterprise | ⚠️ Community | ❌ Self |

**Legend**: ✅ Excellent | ⚠️ Acceptable | ❌ Poor/None

---

## Decision Criteria

### Choose Azure AD B2C if:
- ✅ Already using Azure infrastructure
- ✅ Need enterprise-grade security
- ✅ Want comprehensive GDPR compliance
- ✅ Expect to scale beyond 50K users
- ✅ Need social login + MFA out of the box
- ✅ Want minimal ongoing costs

### Consider Auth0 if:
- Platform agnostic (multi-cloud)
- Need fastest implementation
- Don't care about Azure alignment
- Budget for ongoing costs

### Consider Firebase if:
- Using Google Cloud Platform
- Need real-time database integration
- Building mobile-first app
- Don't need advanced enterprise features

### Build Custom JWT if:
- Have extremely specific requirements
- Have 6-8 weeks development time
- Have security expertise in-house
- Need complete control
- ❌ **Not recommended for Jauntdetour**

---

## Security Checklist

### Pre-Production
- [ ] All traffic uses HTTPS
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Token validation implemented
- [ ] Rate limiting on auth endpoints
- [ ] Session timeout configured
- [ ] CORS properly configured
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] Logging and monitoring configured
- [ ] MFA available
- [ ] Dependencies scanned for vulnerabilities

### Post-Production
- [ ] Monitor failed login attempts
- [ ] Track session anomalies
- [ ] Regular security audits
- [ ] Update dependencies regularly
- [ ] Review audit logs weekly
- [ ] Test disaster recovery plan

---

## Support & Resources

### Documentation
- 📘 [Full Architecture Doc](./authentication-architecture.md)
- 🔒 [Security Considerations](./security-considerations.md)
- 🛠️ [Implementation Guide](./implementation-guide.md)

### External Resources
- [Azure AD B2C Docs](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [MSAL.js GitHub](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [OAuth 2.0 Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [OWASP Auth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Azure Support
- [Azure Support Portal](https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade)
- [Azure AD B2C Community](https://techcommunity.microsoft.com/t5/azure-active-directory-b2c/bd-p/AzureADB2C)

---

## Glossary

- **MAU**: Monthly Active Users - users who authenticate at least once per month
- **MFA**: Multi-Factor Authentication
- **PKCE**: Proof Key for Code Exchange - security extension for OAuth
- **JWT**: JSON Web Token
- **OIDC**: OpenID Connect - identity layer on top of OAuth 2.0
- **SPA**: Single Page Application
- **CSRF**: Cross-Site Request Forgery
- **XSS**: Cross-Site Scripting
- **CORS**: Cross-Origin Resource Sharing
- **JWKS**: JSON Web Key Set - public keys for token verification

---

## Next Steps

1. ✅ Review and approve authentication architecture
2. ⏭️ Create Azure AD B2C tenant
3. ⏭️ Begin Phase 1 implementation
4. ⏭️ Set up development environment
5. ⏭️ Test authentication flows
6. ⏭️ Deploy to staging
7. ⏭️ Production deployment

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Status**: Approved ✅
