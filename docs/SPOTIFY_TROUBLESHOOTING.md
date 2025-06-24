# 🎵 Spotify API Integration - Complete Troubleshooting Guide

## 🔍 Overview

This guide covers all common Spotify API integration issues, their symptoms, debugging steps, and solutions for the WeddingPix application.

## 📋 Quick Diagnostic Checklist

Before diving into specific errors, run this quick checklist:

```typescript
// Run in browser console for quick diagnosis
import { SpotifyDebugger } from './src/services/spotifyErrorHandler';

// Check environment configuration
SpotifyDebugger.logEnvironmentConfig();

// Test API connectivity
await SpotifyDebugger.testSpotifyConnection();

// Validate redirect URI
SpotifyDebugger.validateRedirectUri();
```

---

## 1. 🔑 Invalid or Expired Access Tokens

### Common Error Messages
```
- "The access token expired"
- "Invalid access token"
- "401 Unauthorized"
- "Token validation failed"
```

### Symptoms
- API calls suddenly fail after working
- User gets logged out unexpectedly
- Search/playlist operations return 401 errors

### Debugging Steps

1. **Check Token Expiry**
```typescript
// Check current token status
const credentials = await getValidCredentials();
if (credentials) {
  const now = Date.now();
  const timeUntilExpiry = credentials.expiresAt - now;
  console.log(`Token expires in: ${timeUntilExpiry / 1000 / 60} minutes`);
}
```

2. **Verify Token in Firestore**
```typescript
// Check Firestore for stored credentials
const credentialsQuery = query(collection(db, 'spotifyCredentials'));
const snapshot = await getDocs(credentialsQuery);
snapshot.docs.forEach(doc => {
  const data = doc.data();
  console.log('Stored credentials:', {
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
    expiresAt: new Date(data.expiresAt).toISOString()
  });
});
```

3. **Test Token Validity**
```typescript
// Test current token with Spotify API
try {
  spotifyApi.setAccessToken(credentials.accessToken);
  const user = await spotifyApi.getMe();
  console.log('Token valid, user:', user.body.display_name);
} catch (error) {
  console.log('Token invalid:', error.message);
}
```

### Solution Implementation

```typescript
// Automatic token refresh with retry
export const getValidCredentials = async (): Promise<SpotifyCredentials | null> => {
  try {
    const credentials = await getCurrentCredentials();
    if (!credentials) return null;
    
    // Check if token needs refresh (5 minute buffer)
    const now = Date.now();
    const tokenExpiryBuffer = 5 * 60 * 1000;
    
    if (now + tokenExpiryBuffer >= credentials.expiresAt) {
      console.log('🔄 Token expiring soon, refreshing...');
      return await refreshAccessToken(credentials);
    }
    
    return credentials;
  } catch (error) {
    console.error('Failed to get valid credentials:', error);
    return null;
  }
};
```

### Best Practices
- Always check token expiry before API calls
- Implement automatic refresh with 5-minute buffer
- Store refresh tokens securely in Firestore
- Handle refresh failures gracefully

---

## 2. 🔐 Failed OAuth Authentication Flows

### Common Error Messages
```
- "access_denied"
- "invalid_client"
- "invalid_request"
- "State mismatch. Possible CSRF attack"
- "Code verifier not found"
```

### Symptoms
- User redirected back with error parameters
- Authentication popup/redirect fails
- CSRF state validation errors
- Missing authorization code

### Debugging Steps

1. **Check URL Parameters**
```typescript
// Inspect callback URL parameters
const urlParams = new URLSearchParams(window.location.search);
console.log('OAuth Callback Parameters:', {
  code: urlParams.get('code'),
  state: urlParams.get('state'),
  error: urlParams.get('error'),
  error_description: urlParams.get('error_description')
});
```

2. **Verify PKCE Flow**
```typescript
// Check PKCE parameters in localStorage
const codeVerifier = localStorage.getItem('spotify_pkce_code_verifier');
const storedState = localStorage.getItem('spotify_pkce_state');
console.log('PKCE Parameters:', {
  hasCodeVerifier: !!codeVerifier,
  hasStoredState: !!storedState,
  currentState: urlParams.get('state')
});
```

3. **Validate Authorization URL**
```typescript
// Generate and inspect authorization URL
const authUrl = await getAuthorizationUrl();
console.log('Authorization URL:', authUrl);

// Check required parameters
const url = new URL(authUrl);
const params = url.searchParams;
console.log('Auth URL Parameters:', {
  client_id: params.get('client_id'),
  response_type: params.get('response_type'),
  redirect_uri: params.get('redirect_uri'),
  code_challenge_method: params.get('code_challenge_method'),
  scope: params.get('scope')
});
```

### Solution Implementation

```typescript
// Robust OAuth flow with error handling
export const exchangeCodeForTokens = async (code: string, state: string): Promise<SpotifyCredentials> => {
  try {
    // Verify state parameter (CSRF protection)
    const storedState = localStorage.getItem(PKCE_STATE_KEY);
    if (state !== storedState) {
      throw new Error('State mismatch. Possible CSRF attack.');
    }
    
    // Get code verifier
    const codeVerifier = localStorage.getItem(PKCE_CODE_VERIFIER_KEY);
    if (!codeVerifier) {
      throw new Error('Code verifier not found.');
    }
    
    // Exchange code for tokens
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
    }
    
    // Process successful response...
    
  } catch (error) {
    const spotifyError = SpotifyErrorHandler.handleOAuthError(error, new URLSearchParams(window.location.search));
    throw spotifyError;
  }
};
```

### Best Practices
- Always validate state parameter for CSRF protection
- Use PKCE flow for enhanced security
- Store code verifier securely in localStorage
- Clear sensitive data after successful exchange
- Provide clear error messages for user actions

---

## 3. 🔄 Refresh Token Problems

### Common Error Messages
```
- "invalid_grant"
- "Refresh token is invalid or expired"
- "400 Bad Request" on refresh attempts
```

### Symptoms
- Automatic token refresh fails
- User needs to re-authenticate frequently
- Refresh token becomes invalid

### Debugging Steps

1. **Check Refresh Token Validity**
```typescript
// Test refresh token
try {
  spotifyApi.setRefreshToken(credentials.refreshToken);
  const data = await spotifyApi.refreshAccessToken();
  console.log('Refresh successful:', data.body);
} catch (error) {
  console.log('Refresh failed:', error.body || error.message);
}
```

2. **Monitor Refresh Token Usage**
```typescript
// Log refresh attempts
const refreshAccessToken = async (credentials: SpotifyCredentials) => {
  console.log('🔄 Attempting token refresh:', {
    hasRefreshToken: !!credentials.refreshToken,
    tokenAge: Date.now() - new Date(credentials.createdAt).getTime(),
    lastRefresh: credentials.lastRefresh || 'Never'
  });
  
  try {
    // Refresh logic...
  } catch (error) {
    console.error('Refresh failed:', error);
    throw error;
  }
};
```

### Solution Implementation

```typescript
// Robust refresh token handling
export const refreshAccessToken = async (credentials: SpotifyCredentials): Promise<SpotifyCredentials> => {
  try {
    spotifyApi.setRefreshToken(credentials.refreshToken);
    
    const data = await SpotifyRetryHandler.withRetry(async () => {
      return await spotifyApi.refreshAccessToken();
    });
    
    const expiresAt = Date.now() + (data.body.expires_in * 1000);
    
    const updatedCredentials: Partial<SpotifyCredentials> = {
      accessToken: data.body.access_token,
      expiresAt: expiresAt,
      lastRefresh: new Date().toISOString()
    };
    
    // Update refresh token if provided
    if (data.body.refresh_token) {
      updatedCredentials.refreshToken = data.body.refresh_token;
    }
    
    await updateDoc(doc(db, 'spotifyCredentials', credentials.id), updatedCredentials);
    
    return { ...credentials, ...updatedCredentials };
  } catch (error) {
    // If refresh fails, require re-authentication
    if (error.statusCode === 400 && error.body?.error === 'invalid_grant') {
      await deleteDoc(doc(db, 'spotifyCredentials', credentials.id));
      throw new Error('Refresh token expired. Please re-authenticate.');
    }
    throw error;
  }
};
```

### Best Practices
- Store refresh tokens securely
- Handle refresh token rotation
- Implement fallback to re-authentication
- Monitor refresh token usage patterns

---

## 4. 🔒 API Permission Scope Issues

### Common Error Messages
```
- "Insufficient client scope"
- "403 Forbidden"
- "User not registered in the Developer Dashboard"
- "The user hasn't approved the client"
```

### Symptoms
- Specific API operations fail with 403 errors
- User can authenticate but can't perform actions
- Scope-related errors in console

### Debugging Steps

1. **Check Required Scopes**
```typescript
// Define required scopes for each operation
const REQUIRED_SCOPES = {
  'playlist-read-private': ['getUserPlaylists', 'getPlaylistTracks'],
  'playlist-modify-public': ['addTrackToPlaylist', 'removeTrackFromPlaylist'],
  'playlist-modify-private': ['addTrackToPlaylist', 'removeTrackFromPlaylist'],
  'user-read-private': ['getCurrentUser', 'searchTracks'],
  'user-read-email': ['getCurrentUser']
};

// Check if operation requires specific scope
const checkScope = (operation: string) => {
  for (const [scope, operations] of Object.entries(REQUIRED_SCOPES)) {
    if (operations.includes(operation)) {
      console.log(`Operation ${operation} requires scope: ${scope}`);
    }
  }
};
```

2. **Verify Granted Scopes**
```typescript
// Check what scopes were actually granted
const checkGrantedScopes = async () => {
  try {
    const user = await spotifyApi.getMe();
    console.log('User authenticated successfully');
    
    // Try different operations to test scopes
    try {
      await spotifyApi.getUserPlaylists();
      console.log('✅ playlist-read-private scope granted');
    } catch (error) {
      console.log('❌ playlist-read-private scope missing');
    }
    
  } catch (error) {
    console.log('❌ user-read-private scope missing');
  }
};
```

### Solution Implementation

```typescript
// Comprehensive scope handling
const SPOTIFY_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative', 
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email'
];

export const getAuthorizationUrl = async (): Promise<string> => {
  // ... PKCE setup ...
  
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    state: state,
    scope: SPOTIFY_SCOPES.join(' '), // Request all required scopes
    show_dialog: 'true' // Force consent screen to ensure all scopes are granted
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Scope-aware error handling
export const handleScopeError = (error: any, operation: string) => {
  if (error.statusCode === 403) {
    const requiredScope = getRequiredScope(operation);
    return {
      code: 'INSUFFICIENT_SCOPE',
      message: `Operation ${operation} requires scope: ${requiredScope}`,
      userMessage: 'Unzureichende Spotify-Berechtigungen. Bitte erneut anmelden und alle Berechtigungen gewähren.',
      action: 'reauthorize'
    };
  }
};
```

### Best Practices
- Request all required scopes upfront
- Use `show_dialog=true` to ensure user sees all permissions
- Provide clear error messages for scope issues
- Test each operation with minimal scopes

---

## 5. ⚙️ Client ID/Secret Misconfigurations

### Common Error Messages
```
- "invalid_client"
- "Invalid client credentials"
- "Client authentication failed"
- "INVALID_CLIENT: Invalid client"
```

### Symptoms
- Authentication fails immediately
- Token exchange returns 400 errors
- All Spotify operations fail

### Debugging Steps

1. **Verify Environment Variables**
```typescript
// Check environment configuration
const checkConfig = () => {
  console.log('🔍 Spotify Configuration Check:');
  console.log('Client ID:', import.meta.env.VITE_SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('Client Secret:', import.meta.env.VITE_SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('Redirect URI:', import.meta.env.VITE_SPOTIFY_REDIRECT_URI || '⚠️ Using default');
  
  // Validate Client ID format
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (clientId && clientId.length === 32) {
    console.log('✅ Client ID format valid');
  } else {
    console.log('❌ Client ID format invalid (should be 32 characters)');
  }
};
```

2. **Test Credentials**
```typescript
// Test client credentials with Spotify
const testCredentials = async () => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });
    
    if (response.ok) {
      console.log('✅ Client credentials valid');
    } else {
      const error = await response.json();
      console.log('❌ Client credentials invalid:', error);
    }
  } catch (error) {
    console.log('❌ Failed to test credentials:', error);
  }
};
```

### Solution Implementation

```typescript
// Configuration validation
export const validateSpotifyConfig = (): boolean => {
  const config = {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
    redirectUri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI
  };
  
  // Check required fields
  if (!config.clientId) {
    throw new Error('VITE_SPOTIFY_CLIENT_ID is required');
  }
  
  if (!config.clientSecret) {
    throw new Error('VITE_SPOTIFY_CLIENT_SECRET is required');
  }
  
  // Validate Client ID format
  if (!/^[a-f0-9]{32}$/.test(config.clientId)) {
    throw new Error('Invalid Client ID format');
  }
  
  // Validate Client Secret format  
  if (!/^[a-f0-9]{32}$/.test(config.clientSecret)) {
    throw new Error('Invalid Client Secret format');
  }
  
  return true;
};

// Initialize with validation
export const initializeSpotify = () => {
  try {
    validateSpotifyConfig();
    console.log('✅ Spotify configuration valid');
  } catch (error) {
    console.error('❌ Spotify configuration error:', error.message);
    throw error;
  }
};
```

### Best Practices
- Validate configuration on app startup
- Use environment variables for sensitive data
- Never commit credentials to version control
- Test credentials with client_credentials flow

---

## 6. 🌐 CORS and Redirect URI Errors

### Common Error Messages
```
- "CORS policy blocked the request"
- "invalid_request: Invalid redirect URI"
- "redirect_uri_mismatch"
- "Cross-Origin Request Blocked"
```

### Symptoms
- Network requests fail in browser
- OAuth redirect fails
- Development vs production URL mismatches

### Debugging Steps

1. **Check Redirect URI Configuration**
```typescript
// Validate redirect URI setup
const validateRedirectUri = () => {
  const configuredUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  const currentOrigin = window.location.origin;
  
  console.log('🔍 Redirect URI Validation:');
  console.log('Configured URI:', configuredUri);
  console.log('Current Origin:', currentOrigin);
  console.log('Current URL:', window.location.href);
  
  if (configuredUri && !configuredUri.startsWith(currentOrigin)) {
    console.log('❌ Redirect URI mismatch detected');
    return false;
  }
  
  console.log('✅ Redirect URI validation passed');
  return true;
};
```

2. **Test CORS Headers**
```typescript
// Test Spotify API CORS
const testCors = async () => {
  try {
    const response = await fetch('https://api.spotify.com/v1/', {
      method: 'GET',
      mode: 'cors'
    });
    console.log('✅ CORS test passed');
  } catch (error) {
    console.log('❌ CORS test failed:', error);
  }
};
```

### Solution Implementation

```typescript
// Environment-aware redirect URI
export const getRedirectUri = (): string => {
  // Use environment variable if set, otherwise use current origin
  const envRedirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  
  if (envRedirectUri) {
    return envRedirectUri;
  }
  
  // Fallback to current origin for development
  const currentOrigin = window.location.origin;
  console.warn(`⚠️ Using current origin as redirect URI: ${currentOrigin}`);
  
  return currentOrigin;
};

// CORS-aware fetch wrapper
export const spotifyFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit' // Don't send cookies to avoid CORS issues
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    if (error.message.includes('CORS')) {
      throw new Error('CORS error: Check Spotify app settings and redirect URI configuration');
    }
    throw error;
  }
};
```

### Best Practices
- Configure redirect URIs for all environments
- Use environment variables for different deployments
- Test CORS in development and production
- Provide fallback redirect URI for development

---

## 7. ⏱️ Rate Limiting Problems

### Common Error Messages
```
- "429 Too Many Requests"
- "Rate limit exceeded"
- "API rate limit exceeded"
- "Retry after X seconds"
```

### Symptoms
- API calls fail after working normally
- Temporary failures that resolve after waiting
- 429 HTTP status codes

### Debugging Steps

1. **Monitor Request Frequency**
```typescript
// Track API request frequency
class RequestTracker {
  private requests: number[] = [];
  
  logRequest() {
    const now = Date.now();
    this.requests.push(now);
    
    // Keep only requests from last minute
    this.requests = this.requests.filter(time => now - time < 60000);
    
    console.log(`API requests in last minute: ${this.requests.length}`);
    
    if (this.requests.length > 50) {
      console.warn('⚠️ High request frequency detected');
    }
  }
}

const requestTracker = new RequestTracker();
```

2. **Check Rate Limit Headers**
```typescript
// Monitor rate limit headers
const checkRateLimit = (response: Response) => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  const retryAfter = response.headers.get('Retry-After');
  
  console.log('Rate Limit Info:', {
    remaining,
    reset: reset ? new Date(parseInt(reset) * 1000) : null,
    retryAfter
  });
};
```

### Solution Implementation

```typescript
// Rate limiting with exponential backoff
export class SpotifyRetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if it's a rate limit error
        if (error.statusCode === 429) {
          const retryAfter = error.headers?.['retry-after'] || Math.pow(2, attempt);
          const delay = Math.max(retryAfter * 1000, baseDelay * Math.pow(2, attempt));
          
          console.log(`🔄 Rate limited. Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For non-retryable errors or max retries reached
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Request queue to prevent rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequest = 0;
  private minInterval = 100; // Minimum 100ms between requests
  
  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequest;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }
      
      const operation = this.queue.shift()!;
      this.lastRequest = Date.now();
      
      try {
        await operation();
      } catch (error) {
        console.error('Queued operation failed:', error);
      }
    }
    
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// Use queue for all Spotify API calls
export const queuedSpotifyCall = <T>(operation: () => Promise<T>): Promise<T> => {
  return requestQueue.add(operation);
};
```

### Best Practices
- Implement exponential backoff for retries
- Respect Retry-After headers
- Queue requests to avoid rate limits
- Monitor request frequency
- Cache responses when possible

---

## 🛠️ Security Considerations

### Token Storage
```typescript
// Secure token storage in Firestore
const storeCredentials = async (credentials: SpotifyCredentials) => {
  // Never store in localStorage for production
  // Use Firestore with proper security rules
  await addDoc(collection(db, 'spotifyCredentials'), {
    ...credentials,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  });
};
```

### PKCE Implementation
```typescript
// Secure PKCE flow
export const generateCodeVerifier = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
};
```

### Environment Variables
```bash
# .env file (never commit to git)
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_client_secret_here
VITE_SPOTIFY_REDIRECT_URI=https://yourdomain.com/
```

---

## 📊 Monitoring and Logging

### Error Tracking
```typescript
// Comprehensive error logging
export const logSpotifyError = (error: any, context: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.error('🎵 Spotify Error:', errorLog);
  
  // Send to monitoring service in production
  if (import.meta.env.PROD) {
    // sendToMonitoring(errorLog);
  }
};
```

### Performance Monitoring
```typescript
// Track API performance
export const trackApiCall = async <T>(
  operation: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    console.log(`✅ ${operation} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ ${operation} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

This comprehensive guide covers all major Spotify API integration issues. Each section provides practical debugging steps, code examples, and best practices for robust error handling.