'use server';

import { createClient } from '@/lib/supabase/server';
import { isValidPhone, PHONE_VALIDATION_ERROR } from '@/lib/phone';
import { APPLICATION_NOTIFY_EMAIL, getAdminNotifyRecipients } from '@/lib/notify-email';
import { escapeHtml } from '@/lib/escape-html';

export interface ApplicationData {
  name: string;
  email: string;
  phone?: string;
  type: string;
  message: string;
}

const TYPE_LABELS: Record<string, string> = {
  individual: 'Индивидуальный курс',
  consultation: 'Личная консультация',
  corporate: 'Корпоративный формат',
  other: 'Другое',
};

export async function submitApplication(data: ApplicationData) {
  if (!isValidPhone(data.phone ?? '')) {
    throw new Error(PHONE_VALIDATION_ERROR);
  }

  const supabase = await createClient();

  const phone = data.phone?.trim() || null;

  const { error } = await supabase.from('applications').insert({
    name: data.name,
    email: data.email,
    phone,
    type: data.type,
    message: data.message,
    status: 'new',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Supabase insert error:', error);
    throw new Error(`Ошибка при сохранении заявки: ${error.message}`);
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey && resendKey !== 'your_resend_api_key_here') {
    const recipients = getAdminNotifyRecipients();
    const from = 'onboarding@resend.dev';
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      'https://psychological-course.vercel.app';

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const safeName = escapeHtml(data.name);
      const safeEmail = escapeHtml(data.email);
      const safePhone = data.phone ? escapeHtml(data.phone) : '';
      const safeMessage = escapeHtml(data.message);
      const safeType = escapeHtml(TYPE_LABELS[data.type] ?? data.type);

      const result = await resend.emails.send({
        from,
        to: recipients,
        subject: `Новая заявка от ${data.name} — ${TYPE_LABELS[data.type] ?? data.type}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #a78bfa;">Новая заявка с сайта</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">Имя:</td><td style="padding: 8px 0; font-weight: bold;">${safeName}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
              ${safePhone ? `<tr><td style="padding: 8px 0; color: #666;">Телефон:</td><td style="padding: 8px 0;"><a href="tel:${safePhone}">${safePhone}</a></td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #666;">Тип:</td><td style="padding: 8px 0;">${safeType}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <p style="color: #666; margin: 0 0 8px;">Сообщение:</p>
              <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>
            ${siteUrl ? `<p style="margin-top: 24px; color: #999; font-size: 14px;">
              <a href="${escapeHtml(siteUrl)}/admin/applications">Открыть заявки в админке</a>
            </p>` : ''}
          </div>
        `,
      });

      if (result.error) {
        console.error('[applications] Resend error:', result.error);
      } else {
        console.log('[applications] Email sent to:', APPLICATION_NOTIFY_EMAIL, result.data?.id ?? '');
      }
    } catch (emailError) {
      console.error('[applications] Email send failed:', emailError);
    }
  } else {
    console.warn('[applications] RESEND_API_KEY не задан — письмо не отправлено');
  }

  return { success: true };
}
