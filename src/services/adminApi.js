// Admin API Service for central feedback logging and registered user counts
// Connects securely to the Google Apps Script Web App endpoint

const getApiUrl = () => {
  return import.meta.env.VITE_ADMIN_API_URL || "";
};

// Send a login heartbeat to register/update the user centrally
export async function sendUserHeartbeat(user, googleToken, hasDrivePermission = true, profileData = null) {
  const url = getApiUrl();
  if (!url) {
    // Save locally for fallback mock testing if no endpoint configured
    const localUsers = JSON.parse(localStorage.getItem('farm_mock_registered_users') || '[]');
    const existingIndex = localUsers.findIndex(u => u.email === user.email);
    const updatedUser = {
      email: user.email,
      name: profileData?.name || user.name,
      picture: user.picture || "",
      lastLogin: new Date().toISOString(),
      hasDrivePermission,
      mobile: profileData?.mobile || "",
      state: profileData?.state || "",
      district: profileData?.district || "",
      area: profileData?.area || "",
      pincode: profileData?.pincode || ""
    };
    if (existingIndex !== -1) {
      localUsers[existingIndex] = { ...localUsers[existingIndex], ...updatedUser };
    } else {
      localUsers.push(updatedUser);
    }
    localStorage.setItem('farm_mock_registered_users', JSON.stringify(localUsers));
    return { success: true, isMock: true };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'registerUser',
        email: user.email,
        name: profileData?.name || user.name,
        picture: user.picture || "",
        token: googleToken,
        hasDrivePermission: hasDrivePermission,
        mobile: profileData?.mobile || "",
        state: profileData?.state || "",
        district: profileData?.district || "",
        area: profileData?.area || "",
        pincode: profileData?.pincode || ""
      })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error("Heartbeat sync error:", err);
  }
  return null;
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
    const registeredUsers = JSON.parse(localStorage.getItem('farm_mock_registered_users') || '[]');
    const defaultMockUsers = [
      { email: 'iniansarathi2003@gmail.com', name: 'Inian Sarathi (Admin)', picture: '', lastLogin: new Date().toISOString(), hasDrivePermission: true },
      { email: 'farmer1@gmail.com', name: 'Ramesh Kumar', picture: '', lastLogin: new Date(Date.now() - 3600000).toISOString(), hasDrivePermission: true },
      { email: 'farmer2@gmail.com', name: 'Subramanian T', picture: '', lastLogin: new Date(Date.now() - 86400000).toISOString(), hasDrivePermission: false }
    ];
    // Merge registered with default mocks (avoiding duplicates by email)
    const mockUsers = [...registeredUsers];
    defaultMockUsers.forEach(du => {
      if (!mockUsers.some(mu => mu.email === du.email)) {
        mockUsers.push(du);
      }
    });
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

// Check if a user email is already registered centrally
export async function checkUserRegistration(email) {
  const url = getApiUrl();
  if (!url) {
    const localUsers = JSON.parse(localStorage.getItem('farm_mock_registered_users') || '[]');
    const exists = localUsers.some(u => u.email === email);
    const existingUser = localUsers.find(u => u.email === email);
    
    // Fetch mock notifications
    const mockNotifs = JSON.parse(localStorage.getItem('farm_mock_notifications') || '[]');
    const unread = mockNotifs
      .filter(n => n.email === email && n.status === 'Unread')
      .map(n => ({ 
        message: n.message, 
        timestamp: n.timestamp,
        originalFeedback: n.originalFeedback || "",
        originalScreenshot: n.originalScreenshot || "",
        originalTimestamp: n.originalTimestamp || ""
      }));
      
    return { 
      registered: exists, 
      blocked: false, 
      notifications: unread,
      mobile: existingUser?.mobile || "",
      state: existingUser?.state || "",
      district: existingUser?.district || "",
      area: existingUser?.area || "",
      pincode: existingUser?.pincode || ""
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'checkUser',
        email: email
      })
    });
    if (!response.ok) return { registered: false };
    return await response.json();
  } catch (err) {
    console.error("Check user error:", err);
    return { registered: false };
  }
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

// Send a customer support notification to a user (Admin only)
export async function sendAdminNotification(targetEmail, message, originalFeedback, googleToken) {
  const url = getApiUrl();
  if (!url) {
    // Simulated Sandbox
    const mockNotifs = JSON.parse(localStorage.getItem('farm_mock_notifications') || '[]');
    mockNotifs.push({ 
      email: targetEmail, 
      message, 
      originalFeedback,
      status: 'Unread', 
      timestamp: new Date().toISOString() 
    });
    localStorage.setItem('farm_mock_notifications', JSON.stringify(mockNotifs));
    return { success: true, isMock: true };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: 'sendNotification',
      email: targetEmail,
      message: message,
      originalFeedback: originalFeedback,
      token: googleToken
    })
  });

  if (!response.ok) {
    throw new Error("Failed to send admin notification");
  }

  return await response.json();
}

// Mark user notification as read
export async function markNotificationRead(email, timestamp) {
  const url = getApiUrl();
  if (!url) {
    // Simulated Sandbox
    let mockNotifs = JSON.parse(localStorage.getItem('farm_mock_notifications') || '[]');
    mockNotifs = mockNotifs.map(n => {
      if (n.email === email && n.timestamp === timestamp) {
        return { ...n, status: 'Read' };
      }
      return n;
    });
    localStorage.setItem('farm_mock_notifications', JSON.stringify(mockNotifs));
    return { success: true, isMock: true };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action: 'markNotificationRead',
      email: email,
      timestamp: timestamp
    })
  });

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }

  return await response.json();
}

