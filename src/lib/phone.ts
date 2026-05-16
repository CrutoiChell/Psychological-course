/** Оставляет только допустимые символы телефона: цифры, + в начале, пробелы, (), - */
export function sanitizePhoneInput(value: string): string {
  let out = '';
  for (const ch of value) {
    if (/\d/.test(ch)) {
      out += ch;
    } else if (ch === '+' && out.length === 0) {
      out += ch;
    } else if (/[\s\-()]/.test(ch) && out.length > 0) {
      out += ch;
    }
  }
  return out;
}

/** Количество цифр в строке */
export function phoneDigitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

/** Пустой или корректный номер (от 10 цифр) */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const digits = phoneDigitCount(trimmed);
  return digits >= 10 && digits <= 15;
}

export const PHONE_VALIDATION_ERROR =
  'Укажите корректный номер телефона (только цифры, от 10 знаков)';
