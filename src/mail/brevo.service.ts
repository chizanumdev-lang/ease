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
        this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL') || '';
        this.senderName = this.configService.get<string>('BREVO_SENDER_NAME') || '';
    }

    async sendVerificationEmail(to: string, code: string) {
        const url = 'https://api.brevo.com/v3/smtp/email';
        
        const htmlContent = await render(
            React.createElement(VerificationEmail, { code })
        );

        const data = {
            sender: { name: this.senderName, email: this.senderEmail },
            to: [{ email: to }],
            subject: 'Verify Your Email - Cookeaze',
            htmlContent,
        };

        try {
            await axios.post(url, data, {
                headers: {
                    'api-key': this.apiKey,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`Verification email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${to}: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    async sendPasswordResetEmail(to: string, resetLink: string) {
        const url = 'https://api.brevo.com/v3/smtp/email';
        
        const htmlContent = await render(
            React.createElement(PasswordResetEmail, { resetLink })
        );

        const data = {
            sender: { name: this.senderName, email: this.senderEmail },
            to: [{ email: to }],
            subject: 'Reset Your Password - Cookeaze',
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
            this.logger.error(`Failed to send password reset email to ${to}: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
}
