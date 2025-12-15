import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      // Still return success so form doesn't error
      return NextResponse.json({ 
        success: true,
        warning: 'Email service not configured. Your message was received but no email was sent.'
      });
    }

    try {
      await sendContactFormEmail(validatedData);
      return NextResponse.json({ success: true });
    } catch (emailError: any) {
      console.error('Email sending failed:', emailError);
      // Return success anyway - the message was received
      return NextResponse.json({ 
        success: true,
        warning: 'Message received but email notification failed.'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to process your message. Please try again or email us directly at support@elevate-fitness.com' },
      { status: 500 }
    );
  }
}