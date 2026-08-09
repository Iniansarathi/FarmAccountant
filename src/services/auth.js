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
  const checkAndInit = () => {
    if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.oauth2) {
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
        console.log("Google Identity Services client initialized successfully.");
      } catch (err) {
        console.error("Failed to initialize Google OAuth client:", err);
      }
    } else {
      setTimeout(checkAndInit, 100);
    }
  };

  checkAndInit();
}

export function requestGoogleToken(forceConsent = false, emailHint = '') {
  if (!window.google || !window.google.accounts || !tokenClient) {
    console.warn("Google client script blocked or uninitialized. Falling back to direct OAuth redirect.");
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "336829707172-mockclientid.apps.googleusercontent.com";
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile');
    const responseType = 'token';
    const state = 'google_oauth_fallback';
    
    let oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${scope}&state=${state}`;
    if (emailHint) {
      oauthUrl += `&login_hint=${encodeURIComponent(emailHint)}`;
    }
    window.location.href = oauthUrl;
    return;
  }
  
  const options = {};
  if (forceConsent) {
    options.prompt = 'consent select_account';
  } else if (emailHint) {
    options.prompt = '';
    options.login_hint = emailHint;
  } else {
    options.prompt = 'select_account';
  }
  
  tokenClient.requestAccessToken(options);
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

export async function revokeGoogleToken(token) {
  if (!token) return;
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log("Successfully revoked Google OAuth access token.");
  } catch (err) {
    console.error("Failed to revoke Google access token:", err);
  }
}

export function registerPasswordForGoogleUser(email, password) {
  const users = getLocalUsers();
  const existingIndex = users.findIndex(u => u.username.toLowerCase() === email.toLowerCase());
  if (existingIndex > -1) {
    users[existingIndex].password = password;
  } else {
    users.push({ username: email, password });
  }
  localStorage.setItem('farm_local_users', JSON.stringify(users));
}
