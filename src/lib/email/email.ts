import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from '../../utils/uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  email_from: string;
  bcc: string;
}

// Email message interface
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

// Outbox email record interface
interface OutboxEmailRecord {
  track_id: string;
  client_id?: string;
  user_id?: string;
  customer_id?: string;
  date_send: Date;
  mod_name?: string;
  ref_id?: string;
  recipient: any; // JSON field
  subject: string;
  message: string;
  properties: any; // JSON field
  resend: number;
  status_id: number;
}

// Email service class
class EmailService {
  private config: EmailConfig;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.config = {
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      username: process.env.EMAIL_USERNAME || '',
      password: process.env.EMAIL_PASSWORD || '',
      email_from: process.env.EMAIL_FROM || '',
      bcc: process.env.EMAIL_BCC || '',
    };

    // Validate configuration
    if (!this.config.host || !this.config.username || !this.config.password) {
      throw new Error('Email configuration is incomplete. Please check your .env file.');
    }

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.port === 465, // true for 465, false for other ports
      auth: {
        user: this.config.username,
        pass: this.config.password,
      },
      // Add timeout settings to prevent hanging
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
    });
  }

  /**
   * Save email history to outbox_email table
   * @param message Email message object
   * @param result Nodemailer send result
   * @param options Additional options for saving
   * @returns Promise with saved record
   */
  private async saveEmailHistory(
    message: EmailMessage,
    result: nodemailer.SentMessageInfo,
    options: {
      client_id?: string;
      user_id?: string;
      customer_id?: string;
      mod_name?: string;
      ref_id?: string;
    } = {}
  ): Promise<void> {
    try {
      const trackId = generateUUIDv7(); //TODO: get trackid from caller
      const now = new Date();

      // Prepare recipient data
      const recipient = {
        to: Array.isArray(message.to) ? message.to : [message.to],
        bcc: this.config.bcc && this.config.bcc.trim() !== '' ? [this.config.bcc] : []
      };

      // Prepare message content
      const messageContent = message.html || message.text || '';

      // Prepare properties
      const properties = {
        messageId: result.messageId,
        response: result.response,
        envelope: result.envelope,
        attachments: message.attachments ? message.attachments.map(att => ({ filename: att.filename })) : []
      };

      // Save to outbox_email table
      await prisma.outbox_email.create({
        data: {
          track_id: trackId,
          client_id: options.client_id,
          user_id: options.user_id,
          customer_id: options.customer_id,
          date_send: now,
          mod_name: options.mod_name,
          ref_id: options.ref_id,
          recipient: recipient,
          subject: message.subject,
          message: messageContent,
          properties: properties,
          resend: 0, // Default value as specified
          status_id: 2 // Status deliver as specified
        }
      });

      //console.log(`Email history saved with track_id: ${trackId}`);
    } catch (error) {
      console.error('Error saving email history:', error);
      // Don't throw error here to avoid breaking email sending
    }
  }

  /**
   * Send an email
   * @param message Email message object
   * @param options Additional options for tracking
   * @returns Promise with send result
   */
  async send(
    message: EmailMessage,
    options: {
      client_id?: string;
      user_id?: string;
      customer_id?: string;
      mod_name?: string;
      ref_id?: string;
    } = {}
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      // Verify transporter configuration
      await this.transporter.verify();

      // Prepare email options
      const emailOptions: any = {
        from: this.config.email_from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments,
      };

      // Add BCC if configured and not empty
      if (this.config.bcc && this.config.bcc.trim() !== '') {
        emailOptions.bcc = this.config.bcc;
      }

      // Send email
      const result = await this.transporter.sendMail(emailOptions);

      // Save email history after successful sending
      await this.saveEmailHistory(message, result, options);

      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a simple text email
   * @param to Recipient email address
   * @param subject Email subject
   * @param text Email body text
   * @param options Additional options for tracking
   * @returns Promise with send result
   */
  async sendText(
    to: string,
    subject: string,
    text: string,
    options: {
      client_id?: string;
      user_id?: string;
      customer_id?: string;
      mod_name?: string;
      ref_id?: string;
    } = {}
  ): Promise<nodemailer.SentMessageInfo> {
    return this.send({
      to,
      subject,
      text,
    }, options);
  }

  /**
   * Send an HTML email
   * @param to Recipient email address
   * @param subject Email subject
   * @param html Email body HTML
   * @param options Additional options for tracking
   * @returns Promise with send result
   */
  async sendHtml(
    to: string,
    subject: string,
    html: string,
    options: {
      client_id?: string;
      user_id?: string;
      customer_id?: string;
      mod_name?: string;
      ref_id?: string;
    } = {}
  ): Promise<nodemailer.SentMessageInfo> {
    return this.send({
      to,
      subject,
      html,
    }, options);
  }

  /**
   * Send an email using a template
   * @param to Recipient email address
   * @param subject Email subject
   * @param templateName Template file name
   * @param data Data to replace in template
   * @param options Additional options for tracking
   * @returns Promise with send result
   */
  async sendTemplate(
    to: string,
    subject: string,
    templateName: string,
    data: Record<string, any>,
    options: {
      client_id?: string;
      user_id?: string;
      customer_id?: string;
      mod_name?: string;
      ref_id?: string;
    } = {}
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      // Get the directory name in ES modules
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // Read template file
      const templatePath = path.join(__dirname, '../../templates', templateName);
      let template = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders with data
      Object.keys(data).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(placeholder, data[key]);
      });

      return this.send({
        to,
        subject,
        html: template,
      }, options);
    } catch (error) {
      console.error('Error sending template email:', error);
      throw new Error(`Failed to send template email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current email configuration
   * @returns Email configuration
   */
  getConfig(): EmailConfig {
    return { ...this.config };
  }
}

// Export a singleton instance
const emailService = new EmailService();
export default emailService;

// Export types
export type { EmailConfig, EmailMessage, OutboxEmailRecord };