# Google OAuth Verification & "Access Denied 403" Fix Guide

If users see the following error when trying to log in:
> **Access blocked: farm-accountant.vercel.app has not completed the Google verification process.**
> *Error 403: access_denied*

This happens because the Google OAuth Client ID is currently in **"Testing"** mode in your Google Cloud Console. In testing mode, only email addresses explicitly added as "Test Users" can log in.

To make the app available to **all users**, follow these steps to publish your app to Production.

---

## Step 1: Publish the App in Google Cloud Console

1. Go to the [Google Cloud Console APIs & Services Page](https://console.cloud.google.com/apis/credentials).
2. Select your project from the dropdown at the top.
3. Click on the **OAuth consent screen** tab on the left sidebar.
4. Under the **Publishing status** section, you will see it is set to *Testing*.
5. Click the **PUBLISH APP** button.
6. Click **Confirm** in the popup dialog.

This will change the status to **In Production**. Now, **any user** with a Gmail account can sign in!

---

## Step 2: Bypassing the "Google Has Not Verified This App" Warning

Because the app requests access to Google Drive App Data (`drive.appdata`) to sync backups, Google classifies it as using a sensitive scope. 

Until you submit the app for Google's formal security audit, users signing in for the first time will see a warning screen:
> *"Google has not verified this app"*

To bypass this warning and sign in:
1. On the warning screen, click the small **Advanced** link at the bottom.
2. Click **Go to farm-accountant.vercel.app (unsafe)**.
3. Check/Tick the permissions boxes to allow the app to store sync files on Google Drive, then click **Continue**.

---

## Alternative (For Private Testing Only): Add Specific Test Users

If you only want a few specific farmers to test the app without making it public:
1. Go back to the **OAuth consent screen** page.
2. Scroll down to the **Test users** section.
3. Click **ADD USERS**.
4. Enter the Gmail addresses of your testers (e.g., `user1@gmail.com`) and click **Save**.
