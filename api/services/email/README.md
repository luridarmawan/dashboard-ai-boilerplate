# Email Library

A simple email library for sending emails using configuration from environment variables.

## Configuration

The library uses the following environment variables:

- `EMAIL_HOST` - SMTP server host
- `EMAIL_PORT` - SMTP server port
- `EMAIL_USERNAME` - Email username
- `EMAIL_PASSWORD` - Email password

Make sure these are set in your `.env` file.

## Installation

The library requires the following dependencies which should already be installed in your project:

- `nodemailer`
- `dotenv`
- `@types/nodemailer` (for TypeScript support)

These dependencies are already included in the project's package.json file.
The library requires the following dependencies:

```bash
npm install nodemailer dotenv
npm install --save-dev @types/nodemailer
```

## Usage

### Import the library

```typescript
import { emailService } from './lib';
// or
import emailService from './lib/email';
```

### Send a simple text email

```typescript
await emailService.sendText(
  'recipient@example.com',
  'Subject Line',
  'Email body content'
);
```

### Send an HTML email

```typescript
await emailService.sendHtml(
  'recipient@example.com',
  'Subject Line',
  '<h1>Email Title</h1><p>Email content</p>'
);
```

### Send a custom email with attachments

```typescript
await emailService.send({
  to: 'recipient@example.com',
  subject: 'Subject Line',
  text: 'Plain text version',
  html: '<p>HTML version</p>',
  attachments: [
    {
      filename: 'document.pdf',
      content: fs.readFileSync('path/to/document.pdf')
    }
  ]
});
```

### Get current configuration

```typescript
const config = emailService.getConfig();
console.log(config);
```

## API

### EmailService

#### `send(message: EmailMessage): Promise<nodemailer.SentMessageInfo>`

Send an email with custom options.

#### `sendText(to: string, subject: string, text: string): Promise<nodemailer.SentMessageInfo>`

Send a simple text email.

#### `sendHtml(to: string, subject: string, html: string): Promise<nodemailer.SentMessageInfo>`

Send an HTML email.

#### `getConfig(): EmailConfig`

Get the current email configuration.

## Types

### EmailConfig

```typescript
interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
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