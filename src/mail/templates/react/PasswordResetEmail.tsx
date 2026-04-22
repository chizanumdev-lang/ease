import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  resetLink: string;
}

export const PasswordResetEmail = ({ resetLink }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password - Ease</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Ease</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={p}>
            We received a request to reset your password. Click the button below to choose a new one.
          </Text>
          <Button style={button} href={resetLink}>
            Reset Password
          </Button>
          <Text style={p}>
            If you didn't request a password reset, you can safely ignore this email. This link will expire in 1 hour.
          </Text>
          <Hr style={divider} />
          <Text style={pSmall}>
            If you're having trouble clicking the button, copy and paste this link into your browser:<br />
            <a href={resetLink} style={link}>{resetLink}</a>
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerCopy}>
            &copy; {new Date().getFullYear()} Ease. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f9fafb',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

const container = {
  maxWidth: '600px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  overflow: 'hidden' as const,
  border: '1px solid #e5e7eb',
};

const header = {
  backgroundColor: '#111827',
  padding: '40px 20px',
  textAlign: 'center' as const,
};

const logo = {
  fontSize: '32px',
  fontWeight: '900',
  color: 'white',
  letterSpacing: '-1px',
  margin: '0',
};

const content = {
  padding: '40px',
  textAlign: 'center' as const,
};

const h1 = {
  fontSize: '24px',
  fontWeight: '800',
  marginBottom: '16px',
  color: '#111827',
};

const p = {
  fontSize: '16px',
  color: '#4b5563',
  lineHeight: '24px',
  margin: '16px 0',
};

const button = {
  backgroundColor: '#0066FF',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  margin: '24px auto',
  padding: '16px 32px',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
};

const pSmall = {
  fontSize: '12px',
  color: '#9ca3af',
  lineHeight: '18px',
};

const link = {
  color: '#0066FF',
  textDecoration: 'underline',
};

const footer = {
  padding: '24px',
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
  borderTop: '1px solid #e5e7eb',
};

const footerCopy = {
  fontSize: '14px',
  color: '#9ca3af',
  margin: '0',
};
