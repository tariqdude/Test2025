export const prerender = false;

import type { APIRoute } from 'astro';

// Contact form submission interface
interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  budget?: string;
  timeline?: string;
  message: string;
  newsletter?: boolean;
  terms: boolean;
}

// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation
function validatePhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

// Sanitize input
function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, '').trim();
}

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // Max 5 submissions per 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Send email notification (placeholder - integrate with your email service)
async function sendEmailNotification(formData: ContactFormData): Promise<boolean> {
  try {
    // In production, integrate with email service like SendGrid, AWS SES, etc.
    console.log('Email notification would be sent:', {
      to: 'hello@company.com',
      subject: `New Contact Form Submission: ${formData.subject}`,
      from: formData.email,
      message: formData.message,
      contactInfo: {
        name: `${formData.firstName} ${formData.lastName}`,
        company: formData.company,
        phone: formData.phone,
        budget: formData.budget,
        timeline: formData.timeline
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get client IP (for rate limiting)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check rate limiting
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Too many requests. Please wait before submitting again.'
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse form data
    const formData = await request.formData();
    
    const contactData: ContactFormData = {
      firstName: sanitizeInput(formData.get('firstName') as string || ''),
      lastName: sanitizeInput(formData.get('lastName') as string || ''),
      email: sanitizeInput(formData.get('email') as string || ''),
      company: sanitizeInput(formData.get('company') as string || ''),
      phone: sanitizeInput(formData.get('phone') as string || ''),
      subject: sanitizeInput(formData.get('subject') as string || ''),
      budget: sanitizeInput(formData.get('budget') as string || ''),
      timeline: sanitizeInput(formData.get('timeline') as string || ''),
      message: sanitizeInput(formData.get('message') as string || ''),
      newsletter: formData.get('newsletter') === 'on',
      terms: formData.get('terms') === 'on'
    };

    // Validation
    const errors: string[] = [];

    if (!contactData.firstName) errors.push('First name is required');
    if (!contactData.lastName) errors.push('Last name is required');
    if (!contactData.email) errors.push('Email is required');
    if (!contactData.subject) errors.push('Subject is required');
    if (!contactData.message) errors.push('Message is required');
    if (!contactData.terms) errors.push('You must agree to the terms and conditions');

    if (contactData.email && !validateEmail(contactData.email)) {
      errors.push('Invalid email address');
    }

    if (contactData.phone && !validatePhone(contactData.phone)) {
      errors.push('Invalid phone number');
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Please correct the following errors: ' + errors.join(', ')
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process the submission
    const emailSent = await sendEmailNotification(contactData);

    if (!emailSent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to process your request. Please try again later.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been sent successfully. We\'ll get back to you within 2 hours.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'An unexpected error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const post: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const name = formData.get('name')?.toString() || '';
  const email = formData.get('email')?.toString() || '';
  const message = formData.get('message')?.toString() || '';

  // TODO: Integrate with email service (e.g., SendGrid, Mailgun)
  console.log('Contact form submission:', { name, email, message });

  // Redirect back with a success query param
  return redirect(request.url + '?success=true');
};
