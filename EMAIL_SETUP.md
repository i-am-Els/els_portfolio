# Email Setup Guide

This guide details how to set up the contact form email functionality for the portfolio website.

## Prerequisites
- A Gmail account
- 2-Step Verification enabled on your Google Account

## Step 1: Enable 2-Step Verification
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left navigation menu
3. Under "Signing in to Google," find "2-Step Verification"
4. Follow the steps to enable it
   - You'll need to verify your phone number
   - Set up a backup method

## Step 2: Generate App Password
1. Go back to the Security page
2. Click on "2-Step Verification"
3. Scroll down to find "App passwords" (at the bottom)
4. Click on "App passwords"
5. Select "Mail" from the "Select app" dropdown
6. Select "Other" from the "Select device" dropdown
7. Enter a name like "Portfolio Website"
8. Click "Generate"
9. Google will show you a 16-character password
   - **IMPORTANT**: Copy this password immediately as it won't be shown again
   - Remove all spaces from the password when using it

## Step 3: Set Up Environment Variables
1. Create a `.env.local` file in the project root directory
2. Add these two lines:
```
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_16_character_app_password
```
3. Replace:
   - `your.email@gmail.com` with your Gmail address
   - `your_16_character_app_password` with the password from Step 2 (without spaces)

## Step 4: Restart Development Server
1. Stop your current Next.js development server (Ctrl+C or Cmd+C)
2. Run `npm run dev` again

## Step 5: Test the Contact Form
1. Go to the contact form on your website
2. Fill out the form with test data
3. Submit the form
4. Check your Gmail inbox for the test message

## Troubleshooting
If the form fails to send emails:
1. Verify that 2-Step Verification is properly enabled
2. Check that the App Password was copied correctly (no spaces)
3. Ensure the `.env.local` file is in the correct location
4. Confirm that the development server was restarted after adding the environment variables
5. Check the browser console for any error messages

## Security Notes
- Never commit the `.env.local` file to version control
- Keep your App Password secure and don't share it
- If you suspect your App Password has been compromised, generate a new one in Google Account settings

## Production Deployment
When deploying to production:
1. Add the same environment variables to your hosting platform
2. For Vercel:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add `EMAIL_USER` and `EMAIL_PASS`
3. Redeploy your application

## Backup
Keep a secure backup of your App Password. If you lose it, you'll need to generate a new one. 