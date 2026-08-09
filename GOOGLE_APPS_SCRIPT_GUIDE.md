# Google Apps Script Backend Deployment Guide

This guide explains how to set up the free Google Sheets database to store user registrations and feedbacks, and secure it so only `iniansarathi2003@gmail.com` can view the admin portal.

---

## Step 1: Create a Google Spreadsheet
1. Open [Google Sheets](https://sheets.google.com) and click **Start a new spreadsheet**.
2. Name the spreadsheet **`FarmAccountantAdminData`**.
3. Create four sheets (tabs) inside:
   - Name the first tab: **`Users`**
   - Name the second tab: **`Feedback`**
   - Name the third tab: **`BlockedUsers`**
   - Name the fourth tab: **`Notifications`**

---

## Step 2: Open Extensions Apps Script
1. Inside the spreadsheet menu, click **Extensions** > **Apps Script**.
2. Delete any code in the editor and paste the following script:

```javascript
// Google Apps Script code for FarmAccountant Admin Web App

function doPost(e) {
  var JSON_RESPONSE = { success: false };
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var feedbackSheet = ss.getSheetByName("Feedback") || ss.insertSheet("Feedback");
    var usersSheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
    var deletionSheet = ss.getSheetByName("DeletionRequests") || ss.insertSheet("DeletionRequests");
    var blockedSheet = ss.getSheetByName("BlockedUsers") || ss.insertSheet("BlockedUsers");
    var notificationsSheet = ss.getSheetByName("Notifications") || ss.insertSheet("Notifications");
    
    // Create headers if empty
    if (feedbackSheet.getLastRow() === 0) {
      feedbackSheet.appendRow(["Timestamp", "Email", "Name", "Message", "Screenshot", "Device"]);
    }
    if (usersSheet.getLastRow() === 0) {
      usersSheet.appendRow(["Email", "Name", "Picture", "LastLogin", "DrivePermission"]);
    }
    if (deletionSheet.getLastRow() === 0) {
      deletionSheet.appendRow(["Email", "Name", "Timestamp"]);
    }
    if (blockedSheet.getLastRow() === 0) {
      blockedSheet.appendRow(["Email", "BlockedAt"]);
    }
    if (notificationsSheet.getLastRow() === 0) {
      notificationsSheet.appendRow(["Email", "Message", "Status", "Timestamp", "OriginalFeedback", "OriginalScreenshot", "OriginalTimestamp"]);
    }
    
    if (action === "registerUser") {
      var email = data.email;
      var name = data.name;
      var picture = data.picture || "";
      var lastLogin = new Date().toISOString();
      var hasDrivePermission = data.hasDrivePermission ? "Yes" : "No";
      
      // Check if user is blocked
      var blockedRows = blockedSheet.getDataRange().getValues();
      var isBlocked = false;
      for (var i = 1; i < blockedRows.length; i++) {
        if (blockedRows[i][0] === email) {
          isBlocked = true;
          break;
        }
      }
      
      if (isBlocked) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, blocked: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var userRows = usersSheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var i = 1; i < userRows.length; i++) {
        if (userRows[i][0] === email) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        usersSheet.getRange(foundIndex, 2).setValue(name);
        usersSheet.getRange(foundIndex, 3).setValue(picture);
        usersSheet.getRange(foundIndex, 4).setValue(lastLogin);
        usersSheet.getRange(foundIndex, 5).setValue(hasDrivePermission);
      } else {
        usersSheet.appendRow([email, name, picture, lastLogin, hasDrivePermission]);
      }
      JSON_RESPONSE = { success: true };
      
    } else if (action === "submitFeedback") {
      feedbackSheet.appendRow([
        new Date().toISOString(),
        data.email,
        data.name,
        data.message,
        data.screenshot || "",
        data.device || ""
      ]);
      JSON_RESPONSE = { success: true };
      
    } else if (action === "checkUser") {
      var email = data.email;
      
      // Check if user is blocked
      var blockedRows = blockedSheet.getDataRange().getValues();
      var isBlocked = false;
      for (var i = 1; i < blockedRows.length; i++) {
        if (blockedRows[i][0] === email) {
          isBlocked = true;
          break;
        }
      }
      
      var userRows = usersSheet.getDataRange().getValues();
      var exists = false;
      for (var i = 1; i < userRows.length; i++) {
        if (userRows[i][0] === email) {
          exists = true;
          break;
        }
      }
      
      // Get unread notifications
      var notificationsSheet = ss.getSheetByName("Notifications") || ss.insertSheet("Notifications");
      if (notificationsSheet.getLastRow() === 0) {
        notificationsSheet.appendRow(["Email", "Message", "Status", "Timestamp", "OriginalFeedback", "OriginalScreenshot", "OriginalTimestamp"]);
      }
      var notifRows = notificationsSheet.getDataRange().getValues();
      var unreadNotifications = [];
      for (var i = 1; i < notifRows.length; i++) {
        if (notifRows[i][0] === email && notifRows[i][2] === "Unread") {
          unreadNotifications.push({
            message: notifRows[i][1],
            timestamp: notifRows[i][3],
            originalFeedback: notifRows[i][4] || "",
            originalScreenshot: notifRows[i][5] || "",
            originalTimestamp: notifRows[i][6] || ""
          });
        }
      }
      
      JSON_RESPONSE = { registered: exists, blocked: isBlocked, notifications: unreadNotifications };
      
    } else if (action === "requestDeletion") {
      var email = data.email;
      var name = data.name;
      var timestamp = new Date().toISOString();
      
      var requestRows = deletionSheet.getDataRange().getValues();
      var alreadyExists = false;
      for (var i = 1; i < requestRows.length; i++) {
        if (requestRows[i][0] === email) {
          alreadyExists = true;
          break;
        }
      }
      
      if (!alreadyExists) {
        deletionSheet.appendRow([email, name, timestamp]);
      }
      JSON_RESPONSE = { success: true };
      
    } else if (action === "approveDeletion") {
      var targetEmail = data.email;
      var token = data.token;
      
      if (!token) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Missing authorization token" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Verify email via Google Token Info
      var verifyUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
      var res = UrlFetchApp.fetch(verifyUrl, {
        headers: { "Authorization": "Bearer " + token },
        muteHttpExceptions: true
      });
      
      if (res.getResponseCode() !== 200) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid authentication session" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var profile = JSON.parse(res.getContentText());
      var email = profile.email;
      
      // Strict security check: gate access only to your email
      if (email !== "iniansarathi2003@gmail.com") {
        return ContentService.createTextOutput(JSON.stringify({ error: "Access Denied: Unauthorized admin profile" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Remove from Users list
      var userRows = usersSheet.getDataRange().getValues();
      for (var i = userRows.length - 1; i >= 1; i--) {
        if (userRows[i][0] === targetEmail) {
          usersSheet.deleteRow(i + 1);
        }
      }
      
      // Remove from DeletionRequests list
      var requestRows = deletionSheet.getDataRange().getValues();
      for (var i = requestRows.length - 1; i >= 1; i--) {
        if (requestRows[i][0] === targetEmail) {
          deletionSheet.deleteRow(i + 1);
        }
      }
      
      // Add to Blocked list to prevent re-registration and enforce remote wipe
      var blockedRows = blockedSheet.getDataRange().getValues();
      var alreadyBlocked = false;
      for (var i = 1; i < blockedRows.length; i++) {
        if (blockedRows[i][0] === targetEmail) {
          alreadyBlocked = true;
          break;
        }
      }
      if (!alreadyBlocked) {
        blockedSheet.appendRow([targetEmail, new Date().toISOString()]);
      }
      
      JSON_RESPONSE = { success: true };
      
    } else if (action === "sendNotification") {
      var targetEmail = data.email;
      var message = data.message;
      var token = data.token;
      
      if (!token) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Missing authorization token" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Verify email via Google Token Info
      var verifyUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
      var res = UrlFetchApp.fetch(verifyUrl, {
        headers: { "Authorization": "Bearer " + token },
        muteHttpExceptions: true
      });
      
      if (res.getResponseCode() !== 200) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid authentication session" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var profile = JSON.parse(res.getContentText());
      var email = profile.email;
      
      if (email !== "iniansarathi2003@gmail.com") {
        return ContentService.createTextOutput(JSON.stringify({ error: "Access Denied: Unauthorized admin profile" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var notificationsSheet = ss.getSheetByName("Notifications") || ss.insertSheet("Notifications");
      if (notificationsSheet.getLastRow() === 0) {
        notificationsSheet.appendRow(["Email", "Message", "Status", "Timestamp", "OriginalFeedback", "OriginalScreenshot", "OriginalTimestamp"]);
      }
      
      var originalFeedback = data.originalFeedback || "";
      var originalScreenshot = data.originalScreenshot || "";
      var originalTimestamp = data.originalTimestamp || "";
      notificationsSheet.appendRow([
        targetEmail, 
        message, 
        "Unread", 
        new Date().toISOString(), 
        originalFeedback, 
        originalScreenshot, 
        originalTimestamp
      ]);
      JSON_RESPONSE = { success: true };
      
    } else if (action === "markNotificationRead") {
      var email = data.email;
      var timestamp = data.timestamp;
      
      var notificationsSheet = ss.getSheetByName("Notifications") || ss.insertSheet("Notifications");
      if (notificationsSheet) {
        var notifRows = notificationsSheet.getDataRange().getValues();
        for (var i = 1; i < notifRows.length; i++) {
          if (notifRows[i][0] === email && notifRows[i][3] === timestamp) {
            notificationsSheet.getRange(i + 1, 3).setValue("Read");
          }
        }
      }
      JSON_RESPONSE = { success: true };
    }
    
    return ContentService.createTextOutput(JSON.stringify(JSON_RESPONSE))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var token = "";
    
    // Read auth token from headers or parameters
    var headers = e.headers || {};
    for (var key in headers) {
      if (key.toLowerCase() === "authorization") {
        token = headers[key].replace("Bearer ", "");
        break;
      }
    }
    if (!token) {
      token = e.parameter.token || "";
    }
    
    if (action === "getAdminData") {
      if (!token) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Missing authorization token" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      // Verify email via Google Token Info
      var verifyUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
      var res = UrlFetchApp.fetch(verifyUrl, {
        headers: { "Authorization": "Bearer " + token },
        muteHttpExceptions: true
      });
      
      if (res.getResponseCode() !== 200) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid authentication session" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var profile = JSON.parse(res.getContentText());
      var email = profile.email;
      
      // Strict security check: gate access only to your email
      if (email !== "iniansarathi2003@gmail.com") {
        return ContentService.createTextOutput(JSON.stringify({ error: "Access Denied: Unauthorized admin profile" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var feedbackSheet = ss.getSheetByName("Feedback");
      var usersSheet = ss.getSheetByName("Users");
      var deletionSheet = ss.getSheetByName("DeletionRequests");
      
      var feedbacks = [];
      if (feedbackSheet && feedbackSheet.getLastRow() > 1) {
        var fData = feedbackSheet.getRange(2, 1, feedbackSheet.getLastRow() - 1, 6).getValues();
        for (var i = 0; i < fData.length; i++) {
          feedbacks.push({
            timestamp: fData[i][0],
            email: fData[i][1],
            name: fData[i][2],
            message: fData[i][3],
            screenshot: fData[i][4],
            device: fData[i][5]
          });
        }
      }
      
      var users = [];
      if (usersSheet && usersSheet.getLastRow() > 1) {
        var uData = usersSheet.getRange(2, 1, usersSheet.getLastRow() - 1, 5).getValues();
        for (var i = 0; i < uData.length; i++) {
          users.push({
            email: uData[i][0],
            name: uData[i][1],
            picture: uData[i][2],
            lastLogin: uData[i][3],
            hasDrivePermission: uData[i][4] === "Yes" || uData[i][4] === true
          });
        }
      }
      
      var deletionRequests = [];
      if (deletionSheet && deletionSheet.getLastRow() > 1) {
        var dData = deletionSheet.getRange(2, 1, deletionSheet.getLastRow() - 1, 3).getValues();
        for (var i = 0; i < dData.length; i++) {
          deletionRequests.push({
            email: dData[i][0],
            name: dData[i][1],
            timestamp: dData[i][2]
          });
        }
      }
      
      // Sort newest feedback first
      feedbacks.reverse();
      
      return ContentService.createTextOutput(JSON.stringify({ users: users, feedbacks: feedbacks, deletionRequests: deletionRequests }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Unknown request" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Step 3: Deploy Web App
1. Inside the Apps Script editor, click **Deploy** (top-right button) > **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Configure the settings exactly like this:
   - **Description**: `FarmAccountant Admin Portal API`
   - **Execute as**: **`Me (your_email@gmail.com)`**
   - **Who has access**: **`Anyone`** *(This is required so your mobile device can write feedback rows without requiring Sheets developer API scopes).*
4. Click **Deploy**.
5. Grant permissions:
   - Click **Authorize Access** and select your Google account.
   - Click **Advanced** > **Go to FarmAccountantAdminData (unsafe)**.
   - Click **Allow**.
6. Copy the **Web App URL** generated (it ends with `/exec`).

---

## Step 4: Configure Vercel Settings
1. Open your project settings on [Vercel Dashboard](https://vercel.com).
2. Go to **Settings** > **Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_ADMIN_API_URL`
   - **Value**: *(Paste the Web App URL ending in `/exec`)*
4. Click **Save**.
5. Trigger a new deployment on Vercel to compile this URL into your website bundle!
