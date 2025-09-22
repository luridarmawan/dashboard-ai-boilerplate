# Email Library Documentation

This documentation explains how to use the email library that has been created for this project.

## Overview

The email library is a simple TypeScript library that allows you to send emails using configuration from environment variables. It uses nodemailer under the hood and provides a clean API for sending different types of emails.

## Installation

The email library requires the following dependencies which should already be installed in your project:

- `nodemailer`
- `dotenv`
- `@types/nodemailer` (for TypeScript support)

If they are not installed, you can install them with:

```bash
npm install nodemailer dotenv
npm install --save-dev @types/nodemailer
```

## Configuration

The library reads the following environment variables from your `.env` file:

- `EMAIL_HOST` - SMTP server host (e.g., "smtp.gmail.com")
- `EMAIL_PORT` - SMTP server port (e.g., 587)
- `EMAIL_USERNAME` - Email username (e.g., "your_email@gmail.com")
- `EMAIL_PASSWORD` - Email password or app-specific password
- `EMAIL_FROM` - From address for outgoing emails (e.g., "Your App <noreply@example.com>")
- `EMAIL_BCC` - BCC address(es) for all outgoing emails (optional, leave empty to disable)

Make sure these are set in your `.env` file. You can refer to the `.env.example` file for the expected format.

### BCC Functionality

The email service automatically includes BCC recipients for all outgoing emails if the `EMAIL_BCC` environment variable is configured. This is useful for:

- Keeping a copy of all outgoing emails for audit purposes
- Monitoring email communications
- Backup and compliance requirements

If `EMAIL_BCC` is empty or not set, no BCC will be added to emails.

## Usage

### Importing the Library

You can import the email service in two ways:

```typescript
// Method 1: Import the default export
import emailService from '../src/lib/email';

// Method 2: Import from the index file
import { emailService } from '../src/lib';
```

### Sending a Simple Text Email

```typescript
import { emailService } from '../src/lib';

async function sendWelcomeEmail() {
  try {
    const result = await emailService.sendText(
      'user@example.com',
      'Welcome to Our Service',
      'Thank you for joining our service. We are excited to have you!'
    );
    console.log('Email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
```

### Sending an HTML Email

```typescript
import { emailService } from '../src/lib';

async function sendHTMLEmail() {
  try {
    const result = await emailService.sendHtml(
      'user@example.com',
      'Welcome to Our Service',
      `
      <h1>Welcome!</h1>
      <p>Thank you for joining our service.</p>
      <p>We are excited to have you!</p>
      `
    );
    console.log('HTML email sent successfully:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
```

### Sending a Custom Email with Attachments

```typescript
import { emailService } from '../src/lib';
import fs from 'fs';

async function sendEmailWithAttachments() {
  try {
    const result = await emailService.send({
      to: 'user@example.com',
      subject: 'Report Attached',
      text: 'Please find the attached report.',
      html: '<p>Please find the attached report.</p>',
      attachments: [
        {
          filename: 'report.pdf',
          content: fs.readFileSync('path/to/report.pdf')
        }
      ]
    });
    console.log('Email with attachments sent successfully:', result.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
```

### Getting Configuration Information

```typescript
import { emailService } from '../src/lib';

// Get the current email configuration (password will be masked)
const config = emailService.getConfig();
console.log('Email configuration:', config);
```

## API Reference

### EmailService Class

#### `send(message: EmailMessage): Promise<nodemailer.SentMessageInfo>`

Sends an email with the provided message options.

**Parameters:**
- `message`: An object containing email options

**Returns:**
- Promise that resolves with the sent message info

#### `sendText(to: string, subject: string, text: string): Promise<nodemailer.SentMessageInfo>`

Sends a simple text email.

**Parameters:**
- `to`: Recipient email address
- `subject`: Email subject
- `text`: Email body text

**Returns:**
- Promise that resolves with the sent message info

#### `sendHtml(to: string, subject: string, html: string): Promise<nodemailer.SentMessageInfo>`

Sends an HTML email.

**Parameters:**
- `to`: Recipient email address
- `subject`: Email subject
- `html`: Email body HTML

**Returns:**
- Promise that resolves with the sent message info

#### `getConfig(): EmailConfig`

Returns the current email configuration.

**Returns:**
- Email configuration object

## Types

### EmailConfig

```typescript
interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  email_from: string;
  bcc: string;
}
```

### EmailMessage

```typescript
interface EmailMessage {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
}
```

## Testing

You can test the email library using the provided test script:

```bash
npm run test:email
```

This will run the example file which demonstrates how to use the library.

## Error Handling

The library will throw errors in the following cases:

1. Missing environment variables
2. Invalid SMTP configuration
3. Network issues when connecting to the SMTP server
4. Authentication failures

Always wrap your email sending code in try/catch blocks to handle potential errors gracefully.

## Security Considerations

1. Never commit your `.env` file to version control
2. Use app-specific passwords when possible (especially for Gmail)
3. Consider using OAuth2 for production applications
4. Store sensitive credentials in a secure vault for production

## Example .env Configuration

```env
EMAIL_FROM="Your App <noreply@example.com>"
EMAIL_BCC="admin@example.com"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USERNAME="your_email@gmail.com"
EMAIL_PASSWORD="your_app_password"
```

### BCC Configuration Examples

```env
# Single BCC recipient
EMAIL_BCC="admin@example.com"

# Multiple BCC recipients (comma-separated)
EMAIL_BCC="admin@example.com,audit@example.com"

# No BCC (leave empty or omit)
EMAIL_BCC=""
```

## Troubleshooting

### Emails not sending

1. Check that all environment variables are set correctly
2. Verify SMTP server settings
3. Ensure the email account allows SMTP access
4. Check for firewall or network issues

### Authentication errors

1. Verify username and password are correct
2. If using Gmail, ensure you're using an app-specific password
3. Check if two-factor authentication is enabled

### Connection errors

1. Verify the SMTP host and port are correct
2. Check if your ISP blocks SMTP ports
3. Try using a different port (465 for SSL, 587 for TLS)