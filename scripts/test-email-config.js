const nodemailer = require('nodemailer');

// Try loading different env files in order of preference
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function testEmailConfig() {
  console.log('🔍 Email Configuration Diagnostic Tool');
  console.log('=====================================\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '⚠️ Set (wrong variable name)' : '❌ Not set'}`);
  
  if (process.env.EMAIL_USER) {
    console.log(`Email Preview: ${process.env.EMAIL_USER.substring(0, 3)}***@${process.env.EMAIL_USER.split('@')[1]}`);
  }
  
  if (process.env.EMAIL_PASS) {
    console.log(`EMAIL_PASS Length: ${process.env.EMAIL_PASS.length} characters`);
  }
  
  if (process.env.EMAIL_PASSWORD) {
    console.log(`EMAIL_PASSWORD Length: ${process.env.EMAIL_PASSWORD.length} characters`);
    console.log('⚠️  Found EMAIL_PASSWORD - you need to rename it to EMAIL_PASS');
  }
  
  console.log('\n');

  // Use EMAIL_PASSWORD if EMAIL_PASS is not set (for backwards compatibility during testing)
  const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

  if (!process.env.EMAIL_USER || !emailPass) {
    console.log('❌ Email credentials not configured properly!');
    console.log('\n📝 To fix this:');
    if (process.env.EMAIL_PASSWORD) {
      console.log('1. In your .env file, change EMAIL_PASSWORD to EMAIL_PASS');
      console.log('2. Restart your development server');
    } else {
      console.log('1. Edit your .env file in project root');
      console.log('2. Add these lines:');
      console.log('   EMAIL_USER=your-gmail-address@gmail.com');
      console.log('   EMAIL_PASS=your-16-character-app-password');
    }
    console.log('\n📚 See EMAIL_SETUP.md for detailed instructions');
    return;
  }

  // Test email connection
  try {
    console.log('🔌 Testing email connection...');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: emailPass,
      },
    });

    await transporter.verify();
    console.log('✅ Email connection successful!');
    
    if (process.env.EMAIL_PASSWORD) {
      console.log('\n⚠️  Note: You\'re using EMAIL_PASSWORD. Please rename it to EMAIL_PASS in your .env file');
    }
    
    console.log('\n🎉 Email is properly configured and ready to send verification codes!');
    
  } catch (error) {
    console.log('❌ Email connection failed!');
    console.log('Error:', error.message);
    
    console.log('\n🔧 Common fixes:');
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('• Check your Gmail app-specific password');
      console.log('• Ensure 2-factor authentication is enabled');
      console.log('• Generate a new app password if needed');
    } else {
      console.log('• Check your internet connection');
      console.log('• Verify EMAIL_USER is a valid Gmail address');
      console.log('• Ensure EMAIL_PASS is the 16-character app password');
    }
  }
}

testEmailConfig().catch(console.error); 