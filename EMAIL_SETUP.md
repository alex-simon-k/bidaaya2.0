# Email Setup Guide for Bidaaya

## Email Verification Configuration

The email verification system requires Gmail SMTP credentials to send verification codes.

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Email Service Configuration
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-app-specific-password
```

### Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
   - Use this 16-character password as `EMAIL_PASS`

### Development Mode

If email credentials are not configured, the system automatically enters **development mode**:

- ✅ Verification codes are generated and stored in database
- ✅ Codes are logged to console for testing
- ✅ In development environment, codes are returned in API response
- ⚠️ No actual emails are sent

### Testing Verification

**With Email Setup:**
1. User requests verification code
2. Email sent to user's inbox
3. User enters code from email

**Without Email Setup (Development):**
1. User requests verification code
2. Check browser console or API response for code
3. Use displayed code to complete verification

### Production Requirements

For production deployment, you **MUST** configure:
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app-specific password
- Proper SMTP security settings

### Troubleshooting

**Common Issues:**
- `535 Authentication failed` → Check app password
- `Less secure app` error → Use app password instead of regular password
- Network timeout → Check firewall/proxy settings

**Debug Logging:**
The system includes comprehensive logging with `📧` prefix to help debug email issues.

### Email Templates

Verification emails include:
- 🎨 Professional Bidaaya branding
- 🔢 Large, easy-to-read verification codes
- ⏰ Expiry time (10 minutes)
- 🔒 Security reminders
- 📱 Mobile-friendly design

### Future Enhancements

- [ ] Welcome email sequences
- [ ] Password reset emails
- [ ] Application notification emails
- [ ] Company onboarding emails 