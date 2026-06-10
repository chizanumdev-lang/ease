import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

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

  private getVerificationEmailHtml(code: string): string {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Verify your email</title></head><body style="background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb"><div style="background-color:#0066FF;padding:40px 20px;text-align:center"><h1 style="font-size:32px;font-weight:900;color:white;margin:0">Ease</h1></div><div style="padding:40px;text-align:center"><h2 style="font-size:24px;font-weight:800;color:#111827;margin-bottom:16px">Verify your email</h2><p style="font-size:16px;color:#4b5563;line-height:24px;margin:16px 0">Welcome to Ease! Please use the verification code below to confirm your email address and get started.</p><div style="background-color:#f3f4f6;padding:24px;border-radius:16px;margin:32px 0;border:2px dashed #0066FF33"><p style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0066FF;margin:0">${code}</p></div><p style="font-size:16px;color:#4b5563;line-height:24px;margin:16px 0">This code will expire in 15 minutes. If you didn't request this code, you can safely ignore this email.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/><p style="font-size:12px;color:#9ca3af;margin:16px 0">Questions? Reach out to our support team at info@viicsoft.dev</p></div><div style="padding:24px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:14px;color:#9ca3af;margin:0">© ${new Date().getFullYear()} Ease. All rights reserved.</p></div></div></body></html>`;
  }

  private getPasswordResetEmailHtml(resetLink: string): string {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Reset Your Password</title></head><body style="background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"><div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e7eb"><div style="background-color:#0066FF;padding:40px 20px;text-align:center"><h1 style="font-size:32px;font-weight:900;color:white;margin:0">Ease</h1></div><div style="padding:40px;text-align:center"><h2 style="font-size:24px;font-weight:800;color:#111827;margin-bottom:16px">Reset Your Password</h2><p style="font-size:16px;color:#4b5563;line-height:24px;margin:16px 0">Someone recently requested a password change for your Ease account. If this was you, you can set a new password here:</p><a href="${resetLink}" style="display:inline-block;background-color:#0066FF;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:32px 0">Reset Password</a><p style="font-size:16px;color:#4b5563;line-height:24px;margin:16px 0">If you don't want to change your password or didn't request this, just ignore and delete this message.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/><p style="font-size:12px;color:#9ca3af;margin:16px 0">Questions? Reach out to our support team at info@viicsoft.dev</p></div><div style="padding:24px;text-align:center;background-color:#f9fafb;border-top:1px solid #e5e7eb"><p style="font-size:14px;color:#9ca3af;margin:0">© ${new Date().getFullYear()} Ease. All rights reserved.</p></div></div></body></html>`;
  }

  async sendVerificationEmail(to: string, code: string) {
    const url = 'https://api.brevo.com/v3/smtp/email';

    const htmlContent = this.getVerificationEmailHtml(code);

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

    const htmlContent = this.getPasswordResetEmailHtml(resetLink);

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
