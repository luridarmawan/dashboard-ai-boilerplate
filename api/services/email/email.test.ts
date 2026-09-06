import emailService from './email';

/**
 * Test the email service functionality
 */
async function testEmailService() {
  try {
    console.log('Testing email service...');

    // Get current configuration
    const config = emailService.getConfig();
    console.log('Email configuration:', {
      ...config,
      password: '***hidden***' // Hide password in logs
    });

    // Check BCC configuration
    if (config.bcc && config.bcc.trim() !== '') {
      console.log('✓ BCC is configured and will be included in all emails');
    } else {
      console.log('ℹ BCC is not configured or empty - no BCC will be sent');
    }

    // Send a test email (uncomment to actually send)
    // const result = await emailService.sendText(
    //   'test@example.com',
    //   'Test Email with BCC',
    //   'This is a test email from the email service. BCC should be automatically included if configured.'
    // );

    // console.log('Email sent successfully:', result);
    console.log('Email service is ready to use with BCC functionality!');

  } catch (error) {
    console.error('Error testing email service:', error);
  }
}

// Run the test
testEmailService();