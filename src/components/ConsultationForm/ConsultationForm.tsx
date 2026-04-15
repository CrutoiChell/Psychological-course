'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, User, Mail, Phone, MessageSquare, Loader2 } from 'lucide-react';
import { submitApplication } from '@/app/actions/applications';
import styles from './ConsultationForm.module.scss';

const TYPES = [
  { value: 'individual', label: 'Индивидуальный курс' },
  { value: 'consultation', label: 'Личная консультация' },
  { value: 'corporate', label: 'Корпоративный формат' },
  { value: 'other', label: 'Другое' },
];

export default function ConsultationForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'consultation',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await submitApplication(form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', type: 'consultation', message: '' });
    } catch {
      setError('Произошла ошибка. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Левая колонка — информация */}
        <div className={styles.info}>
          <div className={styles.tag}>
            <span className={styles.tagDot} />
            Персональный подход
          </div>
          <h2 className={styles.title}>
            Хотите индивидуальный курс или личную консультацию?
          </h2>
          <p className={styles.subtitle}>
            Мы поможем составить персональную программу восстановления специально под вашу ситуацию и цели.
          </p>

          <div className={styles.benefits}>
            {[
              { icon: <User size={16} />, text: 'Персональная программа под вас' },
              { icon: <MessageSquare size={16} />, text: 'Разбор вашей конкретной ситуации' },
              { icon: <CheckCircle size={16} />, text: 'Ответ в течение 24 часов' },
              { icon: <Send size={16} />, text: 'Первая консультация бесплатно' },
            ].map((b, i) => (
              <div key={i} className={styles.benefit}>
                <div className={styles.benefitIcon}>{b.icon}</div>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Правая колонка — форма */}
        <div className={styles.form}>
          {success ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>
                <CheckCircle size={40} />
              </div>
              <div className={styles.successTitle}>Заявка отправлена!</div>
              <p className={styles.successText}>
                Мы свяжемся с вами в ближайшее время. Обычно отвечаем в течение 24 часов.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className={styles.error}>
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="cf-name">Имя *</label>
                  <input
                    id="cf-name"
                    type="text"
                    className={styles.input}
                    placeholder="Ваше имя"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cf-email">Email *</label>
                  <input
                    id="cf-email"
                    type="email"
                    className={styles.input}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="cf-phone">Телефон</label>
                  <input
                    id="cf-phone"
                    type="tel"
                    className={styles.input}
                    placeholder="+7 (999) 000-00-00"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cf-type">Тип обращения *</label>
                  <select
                    id="cf-type"
                    className={styles.select}
                    value={form.type}
                    onChange={e => set('type', e.target.value)}
                    required
                  >
                    {TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cf-message">Опишите вашу ситуацию *</label>
                <textarea
                  id="cf-message"
                  className={styles.textarea}
                  placeholder="Расскажите о вашей ситуации, целях или вопросах..."
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  required
                />
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? (
                  <><div className={styles.spinner} /> Отправка...</>
                ) : (
                  <><Send size={18} /> Отправить заявку</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
