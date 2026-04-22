import {
  Body,
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

interface VerificationEmailProps {
  code: string;
}

export const VerificationEmail = ({ code }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email - Ease</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={logo}>Ease</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Verify your email</Heading>
          <Text style={p}>
            Welcome to Ease! Please use the verification code below to confirm your email address and get started.
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{code}</Text>
          </Section>
          <Text style={p}>
            This code will expire in 15 minutes. If you didn't request this code, you can safely ignore this email.
          </Text>
          <Hr style={divider} />
          <Text style={footerText}>
            Questions? Reach out to our support team at info@viicsoft.dev
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
  backgroundColor: '#0066FF',
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

const codeBox = {
  backgroundColor: '#f3f4f6',
  padding: '24px',
  borderRadius: '16px',
  margin: '32px 0',
  border: '2px dashed #0066FF33',
};

const codeText = {
  fontSize: '36px',
  fontWeight: '800',
  letterSpacing: '8px',
  color: '#0066FF',
  margin: '0',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
};

const footerText = {
  fontSize: '12px',
  color: '#9ca3af',
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
