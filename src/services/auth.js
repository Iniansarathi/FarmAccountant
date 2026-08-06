// Authentication Service for local credentials and Google OAuth

export function getLocalUsers() {
  const users = localStorage.getItem('farm_local_users');
  return users ? JSON.parse(users) : [];
}

export function signupLocal(username, password) {
  const users = getLocalUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  const newUser = { username, password };
  users.push(newUser);
  localStorage.setItem('farm_local_users', JSON.stringify(users));
  return { username, type: 'local' };
}

export function loginLocal(username, password) {
  const users = getLocalUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error("Invalid username or password");
  }
  return { username: user.username, type: 'local' };
}

// Google OAuth State
let tokenClient = null;
let currentToken = null;
let tokenExpiry = null;

export function initGoogleOAuth(onTokenReceived, onError) {
  if (typeof window === 'undefined' || !window.google) {
    console.warn("Google client script not loaded yet.");
    return;
  }

  // Use the env variable or a generic development client ID
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "336829707172-mockclientid.apps.googleusercontent.com";

  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      callback: (tokenResponse) => {
        if (tokenResponse.access_token) {
          currentToken = tokenResponse.access_token;
          tokenExpiry = Date.now() + (parseInt(tokenResponse.expires_in, 10) * 1000);
          localStorage.setItem('google_access_token', currentToken);
          localStorage.setItem('google_token_expiry', tokenExpiry.toString());
          onTokenReceived(tokenResponse);
        } else {
          if (onError) onError(tokenResponse);
        }
      },
      error_callback: (err) => {
        if (onError) onError(err);
      }
    });
  } catch (err) {
    console.error("Failed to initialize Google OAuth client:", err);
  }
}

export function requestGoogleToken(forceConsent = false) {
  if (!window.google || !window.google.accounts) {
    throw new Error("google_blocked");
  }
  if (!tokenClient) {
    throw new Error("client_not_initialized");
  }
  const promptValue = forceConsent ? 'consent select_account' : 'select_account';
  tokenClient.requestAccessToken({ prompt: promptValue });
}

export async function fetchGoogleUserInfo(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    throw new Error("Failed to fetch Google user info");
  }
  return await res.json();
}

export function getStoredGoogleToken() {
  const token = localStorage.getItem('google_access_token');
  const expiry = localStorage.getItem('google_token_expiry');
  if (token && expiry && Date.now() < parseInt(expiry, 10)) {
    return token;
  }
  return null;
}

export function clearAuthSession() {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expiry');
  currentToken = null;
  tokenExpiry = null;
}
