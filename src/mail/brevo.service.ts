import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { render } from '@react-email/render';
import * as React from 'react';
import { VerificationEmail } from './templates/react/VerificationEmail';
import { PasswordResetEmail } from './templates/react/PasswordResetEmail';

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') || '';
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME') || '';
  }

  async sendVerificationEmail(to: string, code: string) {
    const url = 'https://api.brevo.com/v3/smtp/email';

    const htmlContent = await render(
      React.createElement(VerificationEmail, { code }),
    );

    const data = {
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: to }],
      subject: 'Verify Your Email - Ease',
      htmlContent,
    };

    if (!this.apiKey) {
      this.logger.warn(
        'BREVO_API_KEY not set. Verification code logged to console for development.',
      );
      this.logger.log(`[DEVELOPMENT] Verification code for ${to}: ${code}`);
      return;
    }

    try {
      await axios.post(url, data, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${to}: ${error.response?.data?.message || error.message}`,
      );
      // Don't throw in development if we can just see the code in the logs
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          `Email sending failed, but continuing since we are in ${process.env.NODE_ENV} mode.`,
        );
        this.logger.log(
          `[DEVELOPMENT-FALLBACK] Verification code for ${to}: ${code}`,
        );
        return;
      }
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const url = 'https://api.brevo.com/v3/smtp/email';

    const htmlContent = await render(
      React.createElement(PasswordResetEmail, { resetLink }),
    );

    const data = {
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: to }],
      subject: 'Reset Your Password - Ease',
      htmlContent,
    };

    try {
      await axios.post(url, data, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}: ${error.response?.data?.message || error.message}`,
      );
      throw error;
    }
  }
}
