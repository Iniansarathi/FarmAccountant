// Admin API Service for central feedback logging and registered user counts
// Connects securely to the Google Apps Script Web App endpoint

const getApiUrl = () => {
  return import.meta.env.VITE_ADMIN_API_URL || "";
};

// Send a login heartbeat to register/update the user centrally
export async function sendUserHeartbeat(user, googleToken) {
  const url = getApiUrl();
  if (!url || !user || user.type !== 'google') return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'registerUser',
        email: user.email,
        name: user.name,
        picture: user.picture || "",
        token: googleToken
      })
    });
  } catch (err) {
    console.error("Heartbeat sync error:", err);
  }
}

// Submit feedback with screenshot and text
export async function submitUserFeedback(user, message, screenshotBase64, deviceMetadata) {
  const url = getApiUrl();
  if (!url) {
    // Save locally for fallback mock testing if no endpoint configured
    const localFeedbacks = JSON.parse(localStorage.getItem('farm_mock_feedbacks') || '[]');
    const newFeedback = {
      timestamp: new Date().toISOString(),
      email: user?.email || 'local_user',
      name: user?.name || user?.username || 'Local Farmer',
      message,
      screenshot: screenshotBase64 || "",
      device: deviceMetadata
    };
    localFeedbacks.push(newFeedback);
    localStorage.setItem('farm_mock_feedbacks', JSON.stringify(localFeedbacks));
    return { success: true, isMock: true };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: 'submitFeedback',
      email: user?.email || 'local_user',
      name: user?.name || user?.username || 'Local Farmer',
      message,
      screenshot: screenshotBase64 || "",
      device: deviceMetadata
    })
  });

  if (!response.ok) {
    throw new Error("Failed to submit feedback to server");
  }

  return await response.json();
}

// Fetch all registered users, feedback logs, and deletion requests (gated for iniansarathi2003@gmail.com)
export async function fetchAdminPortalData(googleToken) {
  const url = getApiUrl();
  if (!url) {
    // Mock data for local testing
    const mockUsers = [
      { email: 'iniansarathi2003@gmail.com', name: 'Inian Sarathi (Admin)', picture: '', lastLogin: new Date().toISOString() },
      { email: 'farmer1@gmail.com', name: 'Ramesh Kumar', picture: '', lastLogin: new Date(Date.now() - 3600000).toISOString() },
      { email: 'farmer2@gmail.com', name: 'Subramanian T', picture: '', lastLogin: new Date(Date.now() - 86400000).toISOString() }
    ];
    const mockFeedbacks = JSON.parse(localStorage.getItem('farm_mock_feedbacks') || '[]');
    if (mockFeedbacks.length === 0) {
      mockFeedbacks.push({
        timestamp: new Date().toISOString(),
        email: 'farmer1@gmail.com',
        name: 'Ramesh Kumar',
        message: 'The sowing machinery calculation works perfectly, thank you!',
        screenshot: '',
        device: 'Android/Chrome'
      });
    }
    const mockDeletionRequests = JSON.parse(localStorage.getItem('farm_mock_deletion_requests') || '[]');
    return { users: mockUsers, feedbacks: mockFeedbacks, deletionRequests: mockDeletionRequests, isMock: true };
  }

  // Fetch with token in query params to bypass CORS preflight header restrictions
  const response = await fetch(`${url}?action=getAdminData&token=${encodeURIComponent(googleToken)}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error("Forbidden or failed to fetch admin logs");
  }

  return await response.json();
}

// Submit a request to delete a user account
export async function requestDeletion(user) {
  const url = getApiUrl();
  if (!url) {
    // Simulated Sandbox
    const requests = JSON.parse(localStorage.getItem('farm_mock_deletion_requests') || '[]');
    if (!requests.includes(user.email)) {
      requests.push(user.email);
      localStorage.setItem('farm_mock_deletion_requests', JSON.stringify(requests));
    }
    return { success: true, isMock: true };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: 'requestDeletion',
      email: user.email,
      name: user.name || user.username
    })
  });

  if (!response.ok) {
    throw new Error("Failed to submit deletion request");
  }

  return await response.json();
}

// Approve account deletion centrally (Admin only)
export async function approveDeletion(targetEmail, googleToken) {
  const url = getApiUrl();
  if (!url) {
    // Simulated Sandbox
    let requests = JSON.parse(localStorage.getItem('farm_mock_deletion_requests') || '[]');
    requests = requests.filter(email => email !== targetEmail);
    localStorage.setItem('farm_mock_deletion_requests', JSON.stringify(requests));
    
    // Also remove them from mock users list if desired (we don't persist users locally, but we can return success)
    return { success: true, isMock: true };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: 'approveDeletion',
      email: targetEmail,
      token: googleToken
    })
  });

  if (!response.ok) {
    throw new Error("Failed to approve deletion request");
  }

  return await response.json();
}

