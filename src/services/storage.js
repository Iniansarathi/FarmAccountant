// Storage Service managing local cache and Google Drive sync

const INITIAL_DATA = {
  crops: [],
  expenses: [],
  harvests: []
};

// Helper for local storage key
const getLocalKey = (username) => `farm_data_local_${username}`;
const getGoogleCacheKey = (email) => `farm_data_google_${email}`;

function mergeData(local, drive) {
  const merged = { crops: [], expenses: [], harvests: [] };
  
  const mergeArrays = (arr1, arr2) => {
    const map = new Map();
    (arr1 || []).forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    (arr2 || []).forEach(item => {
      if (item && item.id) map.set(item.id, item);
    });
    return Array.from(map.values());
  };

  merged.crops = mergeArrays(local.crops, drive.crops);
  merged.expenses = mergeArrays(local.expenses, drive.expenses);
  merged.harvests = mergeArrays(local.harvests, drive.harvests);
  return merged;
}

// Load data based on user type
export async function loadUserData(user, googleToken = null) {
  if (!user) return INITIAL_DATA;

  if (user.type === 'local') {
    const localData = localStorage.getItem(getLocalKey(user.username));
    return localData ? JSON.parse(localData) : INITIAL_DATA;
  }

  // Google OAuth User
  if (user.type === 'google') {
    // Check local cache first for instant loading
    const cachedData = localStorage.getItem(getGoogleCacheKey(user.email));
    const data = cachedData ? JSON.parse(cachedData) : INITIAL_DATA;

    // If no token or it's a mock session, return cached data directly
    if (!googleToken || user.isMock) {
      return { data, fileId: 'mock_file_id', isMock: true };
    }

    try {
      // Fetch from Google Drive
      const query = encodeURIComponent("name = 'FarmAccountantData.json' and trashed = false");
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${googleToken}` },
        cache: 'no-store'
      });

      if (!searchRes.ok) {
        if (searchRes.status === 401 || searchRes.status === 403) {
          throw new Error("permission_denied");
        }
        throw new Error("Failed to search Google Drive");
      }

      const searchResult = await searchRes.json();
      let fileId = null;
      let driveData = null;

      if (searchResult.files && searchResult.files.length > 0) {
        fileId = searchResult.files[0].id;
        
        // Download file content
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const downloadRes = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${googleToken}` },
          cache: 'no-store'
        });

        if (downloadRes.ok) {
          driveData = await downloadRes.json();
        } else {
          console.warn("Failed to download file media, creating new content");
        }
      }

      if (!fileId) {
        // File does not exist, create metadata first
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'FarmAccountantData.json',
            mimeType: 'application/json'
          })
        });

        if (!createRes.ok) {
          if (createRes.status === 401 || createRes.status === 403) {
            throw new Error("permission_denied");
          }
          throw new Error("Failed to create file in Google Drive");
        }

        const newFile = await createRes.json();
        fileId = newFile.id;
        driveData = data || INITIAL_DATA;

        // Save content
        await uploadToGoogleDrive(fileId, driveData, googleToken);
      } else if (driveData) {
        // Merge downloaded data with unsynced local data to prevent data loss
        const mergedData = mergeData(data, driveData);
        localStorage.setItem(getGoogleCacheKey(user.email), JSON.stringify(mergedData));
        await uploadToGoogleDrive(fileId, mergedData, googleToken);
        driveData = mergedData;
      }

      localStorage.setItem('google_drive_file_id', fileId);
      return { data: driveData || data || INITIAL_DATA, fileId };
    } catch (err) {
      console.error("Error syncing with Google Drive:", err);
      // Fallback to cache
      return { data, fileId: localStorage.getItem('google_drive_file_id') || null, error: err.message };
    }
  }

  return INITIAL_DATA;
}

// Upload/Save data to Google Drive media endpoint
export async function uploadToGoogleDrive(fileId, data, googleToken) {
  if (!fileId || !googleToken) return;
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  
  const res = await fetch(uploadUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${googleToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("permission_denied");
    }
    throw new Error("Google Drive update upload failed");
  }
}

// Unified save data function
export async function saveUserData(user, data, googleToken = null, fileId = null) {
  if (!user) return;

  if (user.type === 'local') {
    localStorage.setItem(getLocalKey(user.username), JSON.stringify(data));
    return;
  }

  if (user.type === 'google') {
    // Write cache first
    localStorage.setItem(getGoogleCacheKey(user.email), JSON.stringify(data));

    if (user.isMock) {
      // Mock mode: local updates only
      return;
    }

    if (fileId && googleToken) {
      await uploadToGoogleDrive(fileId, data, googleToken);
    } else {
      throw new Error("No Google credentials available to save to Drive");
    }
  }
}
