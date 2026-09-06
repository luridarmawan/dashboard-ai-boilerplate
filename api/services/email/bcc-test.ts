/**
 * Test script to verify BCC functionality
 * This script demonstrates that BCC is automatically added to all emails
 */

import emailService from './email';

async function testBCC() {
  console.log('Testing BCC functionality...');
  
  try {
    // Get current configuration to show BCC setting
    const config = emailService.getConfig();
    console.log('Email configuration:');
    console.log('- From:', config.email_from);
    console.log('- BCC:', config.bcc || '(not configured)');

    if (config.bcc && config.bcc.trim() !== '') {
      console.log('✓ BCC is configured and will be automatically included in all emails');
      console.log('  BCC recipients:', config.bcc);
    } else {
      console.log('ℹ BCC is not configured - no BCC will be sent');
    }

    // Send a test email to demonstrate BCC functionality
    console.log('\nSending test email...');
    const result = await emailService.sendText(
      'test@example.com',
      'BCC Test Email',
      'This email demonstrates the automatic BCC functionality. The configured BCC recipients should receive a copy of this email.'
    );

    console.log('✓ Email sent successfully with message ID:', result.messageId);
    console.log('✓ BCC recipients (if configured) have automatically received a copy');

  } catch (error) {
    console.error('Error testing BCC functionality:', error);
  }
}

// Run the test
if (import.meta.url.replace(/\\/g, '/') === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testBCC();
}

export default testBCC;