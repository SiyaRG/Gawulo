# OAuth2 Setup Guide

This guide explains how to set up Google and Facebook OAuth2 authentication for the Gawulo platform.

## Prerequisites

- A Google account (for Google OAuth)
- A Facebook account (for Facebook OAuth)
- Access to your application's environment variables

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Gawulo OAuth")
5. Click "Create"

### Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity API"
3. Click on it and click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required information:
     - App name: "Gawulo"
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Add scopes: `email`, `profile`, `openid`
   - Click "Save and Continue"
   - Add test users (optional for development)
   - Click "Save and Continue"
   - Review and click "Back to Dashboard"

4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Gawulo Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3001` (for development)
     - `http://localhost:9033` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:9033/api/auth/oauth/callback/` (for development)
     - `https://yourdomain.com/api/auth/oauth/callback/` (for production)
   - Click "Create"

5. Copy the **Client ID** and **Client Secret**

### Step 4: Configure Environment Variables

Add the following to your `.env` file in the `Gawulo` directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Facebook OAuth Setup

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Choose "Consumer" as the app type
4. Fill in the app details:
   - App Display Name: "Gawulo"
   - App Contact Email: Your email
5. Click "Create App"

### Step 2: Add Facebook Login Product

1. In your app dashboard, find "Add Product to Your App"
2. Click "Set Up" on "Facebook Login"
3. Choose "Web" as the platform
4. Enter your site URL:
   - Development: `http://localhost:3001`
   - Production: Your production domain

### Step 3: Configure Facebook Login Settings

1. In the left sidebar, go to "Facebook Login" > "Settings"
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:9033/api/auth/oauth/callback/` (for development)
   - `https://yourdomain.com/api/auth/oauth/callback/` (for production)
3. Click "Save Changes"

### Step 4: Get App ID and App Secret

1. In the left sidebar, go to "Settings" > "Basic"
2. Copy the **App ID** and **App Secret**
   - Note: You may need to click "Show" next to App Secret to reveal it

### Step 5: Configure Environment Variables

Add the following to your `.env` file in the `Gawulo` directory:

```env
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

## Complete Environment Variables Example

Here's a complete example of all OAuth-related environment variables:

```env
# OAuth2 Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdefghijklmnopqrstuvwxyz123456

# Email Configuration (for 2FA OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com

# OTP Configuration
OTP_EXPIRY_MINUTES=10
```

## Testing OAuth

### Development Testing

1. Make sure your Django server is running on `http://localhost:9033`
2. Make sure your React frontend is running on `http://localhost:3001`
3. Navigate to the login page
4. Click "Continue with Google" or "Continue with Facebook"
5. You should be redirected to the OAuth provider's login page
6. After authentication, you'll be redirected back to your app

### Troubleshooting

#### "Missing required parameter: client_id"
- Check that `GOOGLE_CLIENT_ID` is set in your `.env` file
- Restart your Django server after adding environment variables
- Verify the client ID is correct (no extra spaces or quotes)

#### "Invalid App ID"
- Check that `FACEBOOK_APP_ID` is set in your `.env` file
- Verify the App ID is correct
- Make sure your Facebook app is in "Development" mode (for testing)

#### "Redirect URI mismatch"
- Verify the redirect URI in your OAuth provider settings matches exactly:
  - `http://localhost:9033/api/auth/oauth/callback/` (development)
  - Include the trailing slash
- Check that the redirect URI is added to both:
  - Authorized redirect URIs (Google)
  - Valid OAuth Redirect URIs (Facebook)

#### OAuth works but user isn't created
- Check Django server logs for errors
- Verify email is being returned from the OAuth provider
- Check that the OAuth callback view is handling the response correctly

## Production Considerations

1. **HTTPS Required**: OAuth providers require HTTPS in production
   - Update redirect URIs to use `https://`
   - Ensure your production server has SSL certificates

2. **App Review**: For Facebook, you may need to submit your app for review if you want to use it publicly
   - Development mode allows you to test with specific users
   - Production mode requires app review for most permissions

3. **Security**:
   - Never commit `.env` files to version control
   - Use environment variables or secure secret management in production
   - Rotate OAuth secrets periodically

4. **Rate Limits**: Be aware of OAuth provider rate limits
   - Google: Generally very high limits
   - Facebook: Varies by app type and usage

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Django OAuth Best Practices](https://docs.djangoproject.com/en/stable/topics/auth/)

## Support

If you encounter issues:
1. Check the Django server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test OAuth redirect URIs match exactly
4. Ensure your OAuth apps are properly configured in the provider dashboards

