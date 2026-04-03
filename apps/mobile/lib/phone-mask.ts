/**
 * Telefon numarası maskeleme yardımcıları.
 * @see docs/phase-7-security-hardening.md §5 P1-C, §12
 */

/**
 * Telefon numarasının son 4 hanesini gösterir, geri kalanını maskeler.
 * Boş veya çok kısa değerlerde tüm karakterler maskelenir.
 *
 * Örnekler:
 *   "+90 532 123 45 67"  → "+90 *** *** ** 67"
 *   "05321234567"        → "*******4567"
 *   ""                  → ""
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '*'.repeat(phone.length);

  const visibleDigits = digits.slice(-4);
  let result = '';
  let visibleCount = 0;
  const totalVisible = 4;

  for (let i = phone.length - 1; i >= 0; i--) {
    const ch = phone[i]!;
    if (/\d/.test(ch)) {
      if (visibleCount < totalVisible) {
        result = ch + result;
        visibleCount++;
      } else {
        result = '*' + result;
      }
    } else {
      result = ch + result;
    }
  }

  return result;
}

/**
 * Verilen telefon numarasının maskeli olup olmadığını kontrol eder.
 * Test yardımcısı olarak kullanılır.
 */
export function isMasked(value: string): boolean {
  return value.includes('*');
}
