'use server';

import { createClient } from '@/lib/supabase/server';
import { isValidPhone, PHONE_VALIDATION_ERROR } from '@/lib/phone';

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

  // Сохраняем в БД
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

  // Отправляем email уведомление
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here') {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'onboarding@resend.dev', // замени на свой домен после верификации
        to: process.env.ADMIN_NOTIFY_EMAIL!,
        subject: `Новая заявка от ${data.name} — ${TYPE_LABELS[data.type] ?? data.type}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #a78bfa;">Новая заявка с сайта</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #666;">Имя:</td><td style="padding: 8px 0; font-weight: bold;">${data.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
              ${data.phone ? `<tr><td style="padding: 8px 0; color: #666;">Телефон:</td><td style="padding: 8px 0;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #666;">Тип:</td><td style="padding: 8px 0;">${TYPE_LABELS[data.type] ?? data.type}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
              <p style="color: #666; margin: 0 0 8px;">Сообщение:</p>
              <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
            </div>
            <p style="margin-top: 24px; color: #999; font-size: 14px;">
              Посмотреть все заявки: <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/applications">Админ-панель</a>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // Не блокируем если email не отправился
      console.error('Email send error:', emailError);
    }
  }

  return { success: true };
}
