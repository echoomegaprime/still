/** Nepal mobiles are 10 digits starting 97/98. Accept +977, 977, or local. */
export function normalizeNepalPhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("977") && digits.length >= 13) return `+${digits.slice(0, 13)}`;
  if (digits.length === 10 && /^9[78]/.test(digits)) return `+977${digits}`;
  if (digits.length === 12 && digits.startsWith("977")) return `+${digits}`;
  if (trimmed.startsWith("+") && digits.length >= 11) return `+${digits}`;
  return trimmed.startsWith("+") ? `+${digits}` : digits ? `+${digits}` : "";
}

export function isValidNepalPhone(raw: string): boolean {
  const n = normalizeNepalPhone(raw);
  return /^\+9779[78]\d{8}$/.test(n);
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function smsHref(phone: string, body: string): string {
  const n = normalizeNepalPhone(phone);
  return `sms:${n}?body=${encodeURIComponent(body)}`;
}

export function mailHref(email: string, subject: string, body: string): string {
  return `mailto:${email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
