/**
 * Example usage of the email library
 *
 * To run this example:
 * 1. Make sure you have the required environment variables in your .env file
 * 2. Run `npm run test:email`
 *    or directly with `npx tsx src/lib/email/example.ts`
 */

import { emailService } from './index';
import { generateUUIDv7 } from '../../utils/uuid';

async function main() {
  console.log('main() function called');

  // Generate test IDs
  const testClientId = generateUUIDv7();
  const testUserId = generateUUIDv7();

  try {
    console.log('Starting email sending process...');
    
    // Example 1: Send a simple text email
    console.log('About to send text email...');
    const recipient = 'app@carik.id';
    const subject = 'Hello from Email Library - Dashboard';
    const text = 'This is a simple text email sent using our email library.';
    console.log('🔐 Sending text email to:', recipient);

    // example send email without save tracking information to history
    const textResult = await emailService.sendText(
      recipient,
      subject,
      text,
    );
    console.log(' Email sent successfully!');
    console.log(' Message ID:', textResult.messageId);
    console.log(' Response:', textResult.response);

    // Example 2: Send an HTML email
    console.log('About to send HTML email...');
    const html = `
      <h1>Welcome to Our Service</h1>
      <p>This is an <strong>HTML email</strong> sent using our email library.</p>
      <ul>
        <li>Easy to use</li>
        <li>Configurable via environment variables</li>
        <li>Built with TypeScript</li>
      </ul>
      `;
    console.log('🔐 Sending HTML email to:', recipient);
    const htmlResult = await emailService.sendHtml(
      recipient,
      'HTML Email from Email Library - Dashboard',
      html,
      {
        client_id: testClientId,
        user_id: testUserId,
        mod_name: 'test_module',
        ref_id: 'test_ref_001'
      }
    );
    console.log(' HTML Email sent successfully!');
    console.log(' HTML Message ID:', htmlResult.messageId);

    console.log('');
    console.log('All emails sent successfully!');
  } catch (error) {
    console.error('Error sending emails:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  } finally {
    console.log('Email sending process completed.');
  }
}

// Run the example
if (import.meta.url.replace(/\\/g, '/') === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main();
}

export default main;