# Implementation Guide: Azure AD B2C Integration

## Overview

This guide provides step-by-step instructions for implementing Azure AD B2C authentication in the Jauntdetour application.

---

## Prerequisites

- Azure subscription
- Node.js 16+ installed
- Access to Azure Portal
- Jauntdetour backend and frontend running locally

---

## Phase 1: Azure AD B2C Setup

### Step 1: Create Azure AD B2C Tenant

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource**
3. Search for **Azure Active Directory B2C**
4. Click **Create**
5. Select **Create a new Azure AD B2C Tenant**
6. Fill in the details:
   - **Organization name**: Jauntdetour
   - **Initial domain name**: jauntdetour (will become jauntdetour.onmicrosoft.com)
   - **Country/Region**: Select appropriate region (US or EU based on user base)
7. Click **Review + create** → **Create**
8. Wait for tenant creation (may take a few minutes)
9. Click **Link** to link the tenant to your subscription

### Step 2: Configure Application Registration

1. Switch to your B2C tenant (top-right corner of Azure Portal)
2. Navigate to **Azure AD B2C** service
3. Under **Manage**, select **App registrations**
4. Click **New registration**
5. Fill in the details:
   - **Name**: Jauntdetour Web App
   - **Supported account types**: Accounts in any identity provider or organizational directory
   - **Redirect URI**: 
     - Platform: Single-page application (SPA)
     - URI: `http://localhost:3001/auth/callback` (development)
     - Add production URI later: `https://jauntdetour.com/auth/callback`
6. Click **Register**
7. Note the **Application (client) ID** - you'll need this

### Step 3: Configure Authentication Settings

1. In your app registration, go to **Authentication**
2. Under **Implicit grant and hybrid flows**:
   - ✅ Check **Access tokens**
   - ✅ Check **ID tokens**
3. Under **Advanced settings**:
   - Allow public client flows: **No**
4. Click **Save**

### Step 4: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `openid`
   - `offline_access`
   - `profile`
   - `email`
6. Click **Add permissions**
7. Click **Grant admin consent for [tenant]**

### Step 5: Create User Flows

#### Sign Up and Sign In Flow

1. In Azure AD B2C, go to **User flows**
2. Click **New user flow**
3. Select **Sign up and sign in**
4. Select **Recommended** version
5. Name: `B2C_1_signupsignin`
6. Under **Identity providers**:
   - ✅ Email signup
7. Under **User attributes and claims**, select:
   - Collect attributes:
     - ✅ Display Name
     - ✅ Email Address
   - Return claims:
     - ✅ Display Name
     - ✅ Email Addresses
     - ✅ User's Object ID
8. Click **Create**

#### Password Reset Flow

1. Click **New user flow**
2. Select **Password reset**
3. Select **Recommended** version
4. Name: `B2C_1_passwordreset`
5. Under **Identity providers**:
   - ✅ Reset password using email address
6. Under **Application claims**, select:
   - ✅ Email Addresses
   - ✅ User's Object ID
7. Click **Create**

#### Profile Editing Flow

1. Click **New user flow**
2. Select **Profile editing**
3. Select **Recommended** version
4. Name: `B2C_1_profileediting`
5. Under **Identity providers**:
   - ✅ Local Account SignIn
6. Under **User attributes**, select:
   - ✅ Display Name
7. Under **Application claims**, select:
   - ✅ Display Name
   - ✅ Email Addresses
   - ✅ User's Object ID
8. Click **Create**

### Step 6: Configure Social Identity Providers (Optional)

#### Google Identity Provider

1. First, create Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Application type: Web application
   - Authorized redirect URIs: `https://jauntdetour.b2clogin.com/jauntdetour.onmicrosoft.com/oauth2/authresp`
   - Note the **Client ID** and **Client Secret**

2. In Azure AD B2C:
   - Go to **Identity providers**
   - Click **New OpenID Connect provider**
   - Name: `Google`
   - Metadata URL: `https://accounts.google.com/.well-known/openid-configuration`
   - Client ID: [Your Google Client ID]
   - Client Secret: [Your Google Client Secret]
   - Scope: `openid email profile`
   - Response type: `code`
   - Response mode: `form_post`
   - Click **Save**

3. Update user flows to include Google:
   - Edit `B2C_1_signupsignin`
   - Under **Identity providers**, add **Google**
   - Click **Save**

#### Facebook Identity Provider

Similar process - see [Microsoft documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/identity-provider-facebook) for detailed steps.

---

## Phase 2: Backend Integration

### Step 1: Install Dependencies

```bash
cd backend
npm install @azure/msal-node jsonwebtoken jwks-rsa express-session redis connect-redis
```

### Step 2: Configure Environment Variables

Create or update `backend/.env`:

```bash
# Azure AD B2C Configuration
AZURE_AD_B2C_TENANT_NAME=jauntdetour
AZURE_AD_B2C_CLIENT_ID=<your-client-id>
AZURE_AD_B2C_DOMAIN=jauntdetour.b2clogin.com
AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY=B2C_1_signupsignin
AZURE_AD_B2C_PASSWORD_RESET_POLICY=B2C_1_passwordreset
AZURE_AD_B2C_PROFILE_EDIT_POLICY=B2C_1_profileediting

# Application
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# Session
SESSION_SECRET=<generate-a-strong-secret>
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

### Step 3: Create Auth Configuration

Create `backend/config/azureAdB2c.js`:

```javascript
const config = {
  auth: {
    clientId: process.env.AZURE_AD_B2C_CLIENT_ID,
    authority: `https://${process.env.AZURE_AD_B2C_DOMAIN}/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY}`,
    knownAuthorities: [process.env.AZURE_AD_B2C_DOMAIN],
    redirectUri: `${process.env.BACKEND_URL}/api/auth/callback`,
    validateAuthority: false
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        if (process.env.NODE_ENV === 'development') {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 'Info'
    }
  }
};

const policies = {
  signUpSignIn: process.env.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY,
  passwordReset: process.env.AZURE_AD_B2C_PASSWORD_RESET_POLICY,
  profileEdit: process.env.AZURE_AD_B2C_PROFILE_EDIT_POLICY
};

const jwksUri = `https://${process.env.AZURE_AD_B2C_DOMAIN}/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/discovery/v2.0/keys?p=${process.env.AZURE_AD_B2C_SIGNUP_SIGNIN_POLICY}`;

module.exports = {
  config,
  policies,
  jwksUri
};
```

### Step 4: Create Token Validation Middleware

Create `backend/middleware/validateToken.js`:

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { jwksUri } = require('../config/azureAdB2c');

const client = jwksClient({
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
  jwksUri
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  jwt.verify(token, getSigningKey, {
    audience: process.env.AZURE_AD_B2C_CLIENT_ID,
    issuer: `https://${process.env.AZURE_AD_B2C_DOMAIN}/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/v2.0/`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('Token validation error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = {
      id: decoded.oid,
      email: decoded.emails?.[0] || decoded.email,
      name: decoded.name
    };
    
    next();
  });
}

module.exports = validateToken;
```

### Step 5: Create Auth Routes

Create `backend/routes/auth.js`:

```javascript
const express = require('express');
const router = express.Router();
const msal = require('@azure/msal-node');
const { config, policies } = require('../config/azureAdB2c');

const msalClient = new msal.ConfidentialClientApplication(config);

// Get authorization URL
router.get('/login', (req, res) => {
  const authCodeUrlParameters = {
    scopes: ['openid', 'profile', 'offline_access'],
    redirectUri: config.auth.redirectUri
  };
  
  msalClient.getAuthCodeUrl(authCodeUrlParameters)
    .then(response => {
      res.json({ authUrl: response });
    })
    .catch(error => {
      console.error('Error getting auth URL:', error);
      res.status(500).json({ error: 'Failed to get authorization URL' });
    });
});

// Handle callback and exchange code for tokens
router.post('/callback', async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }
  
  const tokenRequest = {
    code,
    scopes: ['openid', 'profile', 'offline_access'],
    redirectUri: config.auth.redirectUri
  };
  
  try {
    const response = await msalClient.acquireTokenByCode(tokenRequest);
    
    // Store refresh token in httpOnly cookie
    res.cookie('refreshToken', response.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    });
    
    // Return access token and user info
    res.json({
      accessToken: response.accessToken,
      expiresOn: response.expiresOn,
      user: {
        id: response.account.homeAccountId,
        email: response.account.username,
        name: response.account.name
      }
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).json({ error: 'Failed to exchange authorization code' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  const refreshTokenRequest = {
    refreshToken,
    scopes: ['openid', 'profile', 'offline_access']
  };
  
  try {
    const response = await msalClient.acquireTokenByRefreshToken(refreshTokenRequest);
    
    // Update refresh token cookie
    res.cookie('refreshToken', response.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    });
    
    res.json({
      accessToken: response.accessToken,
      expiresOn: response.expiresOn
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.clearCookie('refreshToken');
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

module.exports = router;
```

### Step 6: Update Express App

Update `backend/index.js`:

```javascript
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const validateToken = require('./middleware/validateToken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/user/profile', validateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

---

## Phase 3: Frontend Integration

### Step 1: Install Dependencies

```bash
cd frontend
npm install @azure/msal-browser @azure/msal-react
```

### Step 2: Configure MSAL

Create `frontend/src/config/authConfig.js`:

```javascript
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_CLIENT_ID,
    authority: `https://${process.env.REACT_APP_AZURE_AD_DOMAIN}/${process.env.REACT_APP_AZURE_AD_TENANT_NAME}.onmicrosoft.com/${process.env.REACT_APP_AZURE_AD_POLICY}`,
    knownAuthorities: [process.env.REACT_APP_AZURE_AD_DOMAIN],
    redirectUri: window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'offline_access']
};
```

### Step 3: Create Environment Variables

Create or update `frontend/.env`:

```bash
REACT_APP_AZURE_AD_CLIENT_ID=<your-client-id>
REACT_APP_AZURE_AD_TENANT_NAME=jauntdetour
REACT_APP_AZURE_AD_DOMAIN=jauntdetour.b2clogin.com
REACT_APP_AZURE_AD_POLICY=B2C_1_signupsignin
REACT_APP_API_URL=http://localhost:3000
```

### Step 4: Setup MSAL Provider

Update `frontend/src/index.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/authConfig';
import App from './App';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
```

### Step 5: Create Auth Context

Create `frontend/src/context/AuthContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../config/authConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (accounts.length > 0) {
      setUser({
        id: accounts[0].homeAccountId,
        email: accounts[0].username,
        name: accounts[0].name
      });
      setIsAuthenticated(true);
      acquireToken();
    }
  }, [accounts]);

  const acquireToken = async () => {
    const request = {
      ...loginRequest,
      account: accounts[0]
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      setAccessToken(response.accessToken);
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      await instance.acquireTokenRedirect(request);
    }
  };

  const login = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin
      });
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    accessToken,
    user,
    isAuthenticated,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

### Step 6: Create Protected Route Component

Create `frontend/src/components/ProtectedRoute.js`:

```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

### Step 7: Create Login Component

Create `frontend/src/components/Login.js`:

```javascript
import React from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="login-container">
      <h1>Welcome to Jauntdetour</h1>
      <p>Plan your road trip with exciting detours</p>
      <button onClick={login} className="login-button">
        Sign In / Sign Up
      </button>
    </div>
  );
}
```

### Step 8: Update App Component

Update `frontend/src/App.js`:

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './components/Login';
// Import your existing components
// import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {/* <Dashboard /> */}
                <div>Protected Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Step 9: Create API Client with Auth

Create `frontend/src/services/api.js`:

```javascript
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;

export function useApi() {
  const { accessToken } = useAuth();

  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    get: (endpoint) => apiCall(endpoint),
    post: (endpoint, data) => apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    put: (endpoint, data) => apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (endpoint) => apiCall(endpoint, {
      method: 'DELETE'
    })
  };
}
```

---

## Phase 4: Testing

### Local Testing

1. **Start Redis** (for session storage):
   ```bash
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

4. **Test Authentication Flow**:
   - Navigate to `http://localhost:3001`
   - Click "Sign In / Sign Up"
   - You should be redirected to Azure AD B2C login page
   - Create a test account or login
   - Verify redirect back to app with authenticated session

### Test Scenarios

1. **Sign Up**: Create new account with email/password
2. **Sign In**: Login with existing account
3. **Social Login**: Login with Google (if configured)
4. **Token Refresh**: Wait for token to expire and verify auto-refresh
5. **Logout**: Logout and verify session is cleared
6. **Protected Routes**: Try accessing protected routes without auth
7. **API Calls**: Make authenticated API calls

---

## Production Deployment

### Environment Variables

Update environment variables for production:

**Backend**:
```bash
AZURE_AD_B2C_TENANT_NAME=jauntdetour
AZURE_AD_B2C_CLIENT_ID=<production-client-id>
AZURE_AD_B2C_DOMAIN=jauntdetour.b2clogin.com
FRONTEND_URL=https://jauntdetour.com
BACKEND_URL=https://api.jauntdetour.com
NODE_ENV=production
SESSION_SECRET=<strong-production-secret>
REDIS_URL=<production-redis-url>
```

**Frontend**:
```bash
REACT_APP_AZURE_AD_CLIENT_ID=<production-client-id>
REACT_APP_AZURE_AD_TENANT_NAME=jauntdetour
REACT_APP_AZURE_AD_DOMAIN=jauntdetour.b2clogin.com
REACT_APP_AZURE_AD_POLICY=B2C_1_signupsignin
REACT_APP_API_URL=https://api.jauntdetour.com
```

### Update Azure AD B2C Configuration

1. Add production redirect URIs:
   - `https://jauntdetour.com/auth/callback`
   - `https://jauntdetour.com`

2. Update CORS in backend for production domain

3. Update social identity provider redirect URIs if using

---

## Troubleshooting

### Common Issues

**Issue**: "AADB2C90075: The Claims exchange specified in step 'X' returned HTTP error response with Code 'Y' and Reason 'Z'"
**Solution**: Check your user flow configuration and ensure all identity providers are properly configured.

**Issue**: Token validation fails
**Solution**: Verify the JWKS URI is correct and the tenant name matches exactly.

**Issue**: CORS errors
**Solution**: Ensure backend CORS is configured to allow frontend domain and credentials.

**Issue**: Cookies not being set
**Solution**: Check that `credentials: 'include'` is set in fetch calls and CORS allows credentials.

**Issue**: Redirect loop
**Solution**: Check redirect URIs match exactly in Azure AD B2C and frontend config.

### Debug Mode

Enable debug logging:

**Backend**:
```javascript
// In azureAdB2c.js
system: {
  loggerOptions: {
    loggerCallback(loglevel, message, containsPii) {
      console.log(message);
    },
    piiLoggingEnabled: true, // Enable for debugging only
    logLevel: 'Verbose'
  }
}
```

**Frontend**:
```javascript
// In authConfig.js
system: {
  loggerOptions: {
    loggerCallback: (level, message, containsPii) => {
      console.log(message);
    },
    logLevel: 'Verbose'
  }
}
```

---

## Next Steps

After successful implementation:

1. **Customize UI**: Brand the login pages with Jauntdetour theme
2. **Add MFA**: Enable multi-factor authentication
3. **User Management**: Build user profile and settings pages
4. **Analytics**: Track login patterns and user engagement
5. **Security Hardening**: Implement rate limiting, monitoring
6. **GDPR Compliance**: Add data export and deletion features

---

## Resources

- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [MSAL React Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [MSAL Node Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node)
