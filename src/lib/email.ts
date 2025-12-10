import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.RESEND_FROM_EMAIL || 'elevate871@gmail.com';

interface OrderConfirmationData {
  name: string;
  email: string;
  orderNumber: string;
  totalAmount: number;
  products: Array<{
    name: string;
    price: number;
  }>;
  downloadLinks: Array<{
    productName: string;
    downloadUrl: string;
  }>;
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const productsHtml = data.products
    .map(
      (p) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A;">${p.name}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #2A2A2A; text-align: right;">$${(p.price / 100).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const downloadsHtml = data.downloadLinks
    .map(
      (link) => `
    <div style="margin: 16px 0;">
      <strong style="color: #F5F5F5;">${link.productName}</strong><br/>
      <a href="${link.downloadUrl}" style="color: #B8860B; text-decoration: none; display: inline-block; margin-top: 8px; padding: 12px 24px; background: #1A1A1A; border-radius: 4px;">
        Download Now
      </a>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0A0A0A; color: #F5F5F5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #B8860B; font-size: 32px; margin: 0; letter-spacing: 2px;">ELEVATE</h1>
            <p style="color: #A0A0A0; margin: 8px 0 0 0;">FITNESS</p>
          </div>
          
          <div style="background: #141414; border: 1px solid #2A2A2A; border-radius: 8px; padding: 32px;">
            <h2 style="color: #F5F5F5; margin: 0 0 24px 0;">Order Confirmation</h2>
            
            <p style="color: #A0A0A0; line-height: 1.6;">
              Hi ${data.name},<br/><br/>
              Thank you for your purchase! Your order has been confirmed and your products are ready for download.
            </p>
            
            <div style="margin: 32px 0; padding: 24px; background: #0A0A0A; border-radius: 4px;">
              <p style="color: #A0A0A0; margin: 0 0 8px 0; font-size: 14px;">ORDER NUMBER</p>
              <p style="color: #F5F5F5; margin: 0; font-size: 18px; font-weight: 600;">${data.orderNumber}</p>
            </div>
            
            <h3 style="color: #F5F5F5; margin: 32px 0 16px 0;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${productsHtml}
              <tr>
                <td style="padding: 16px 0; font-weight: 600; color: #F5F5F5;">Total</td>
                <td style="padding: 16px 0; text-align: right; font-weight: 600; color: #B8860B;">$${(data.totalAmount / 100).toFixed(2)}</td>
              </tr>
            </table>
            
            <h3 style="color: #F5F5F5; margin: 32px 0 16px 0;">Download Your Products</h3>
            <div style="background: #0A0A0A; padding: 24px; border-radius: 4px;">
              ${downloadsHtml}
            </div>
            
            <p style="color: #A0A0A0; line-height: 1.6; margin: 32px 0 0 0; font-size: 14px;">
              You can also access your purchases anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #B8860B; text-decoration: none;">customer dashboard</a>.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 32px; border-top: 1px solid #2A2A2A;">
            <p style="color: #A0A0A0; font-size: 14px; margin: 0;">
              Questions? Contact us at <a href="mailto:elevate871@gmail.com" style="color: #B8860B; text-decoration: none;">elevate871@gmail.com</a>
            </p>
            <p style="color: #666; font-size: 12px; margin: 16px 0 0 0;">
              © ${new Date().getFullYear()} Elevate. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `Elevate Fitness <${fromEmail}>`,
      to: data.email,
      subject: `Your Elevate Fitness Order (#${data.orderNumber})`,
      html,
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export async function sendContactFormEmail(data: ContactFormData) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #0A0A0A; color: #F5F5F5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #141414; border: 1px solid #2A2A2A; border-radius: 8px; padding: 32px;">
          <h2 style="color: #B8860B;">New Contact Form Submission</h2>
          <p><strong>From:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #0A0A0A; padding: 16px; border-radius: 4px; margin-top: 16px;">
            ${data.message.replace(/\n/g, '<br/>')}
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: `Elevate Contact Form <${fromEmail}>`,
      to: process.env.ADMIN_EMAIL || 'elevate871@gmail.com',
      replyTo: data.email,
      subject: `Contact Form: ${data.name}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send contact form email:', error);
    throw error;
  }
}