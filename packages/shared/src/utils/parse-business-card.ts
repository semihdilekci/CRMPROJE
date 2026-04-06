/**
 * Parses raw OCR text from a business card image and extracts
 * company name, contact name, phone, and email.
 *
 * Parse önceliği:
 * 1. Telefon — en kolay, satırı elenir
 * 2. E-posta — @ her zaman var
 * 3. Firma — @ sağı (domain) mutlaka firma adı; kartvizitte doğru yazım aranır
 * 4. Ad Soyad — @ solu (local) ipucu; kartvizitte eşleşen isim aranır
 *    (sdilekci → Semih Dilekci, mehmet.tetik → Mehmet Tetik)
 */

export interface ParsedBusinessCard {
  company: string;
  name: string;
  phone: string;
  email: string;
}

const EMAIL_REGEX =
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9äöüÄÖÜß.\-]+\.[a-zA-Z]{2,}\b/g;
const EMAIL_REGEX_RELAXED =
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9äöüÄÖÜß.\-]+\b/g;

// Telefon formatları: + ile başlayan, 0 ile başlayan, parantezli alan kodu
// +90 5xx, +49 30 12345678 | +1 555-987-6543 | 0212 456 56 56 | 0545 5969393 | 534 9690293 | (345) 349 93 99
const PHONE_REGEX =
  /\+\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|\+\d{1,3}[\s.-]?\d[\d\s.-]{6,14}\b|\+90\s?5[0-9]{2}[\s.-]?[0-9]{7}|0?5[0-9]{2}[\s.-]?[0-9]{7}|5[0-9]{2}[\s.-]?[0-9]{6,7}|0[1-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\(\d{2,4}\)\s*[\d\s.-]{6,12}/g;

// Company indicators (Ltd, A.Ş., Inc, etc.)
const COMPANY_INDICATORS = [
  /\b(?:ltd|limited|a\.?ş\.?|inc\.?|gmbh|san\.?\s*ve\s*tic\.?)\b/i,
  /\b(?:holding|grup|group|company|co\.?)\b/i,
];

// Address indicators — exclude these from company/name assignment
const ADDRESS_INDICATORS = [
  /\b(?:mah\.?|mahallesi|cad\.?|caddesi|sok\.?|sokak|bulvar|blv\.?)\b/i,
  /\b(?:straße|str\.?|strasse)\b/i,
  /\b(?:no\.?|no:)\s*\d/i,
  /\b\d{5}\s+[A-Za-zäöüÄÖÜß]+/i, // 10119 Berlin
  /\/[A-Za-zÇçĞğİıÖöŞşÜü]+$/i,
  /^\d+[\/\-]\w+/i,
];

// Person name: 2-4 words, letters only (Turkish + German chars), no numbers
const PERSON_NAME_REGEX = /^[A-Za-zÇçĞğİıÖöŞşÜüäöüÄÖÜß\s]{4,50}$/;

function extractEmail(text: string): string {
  const normalized = text.replace(/©/g, '@');
  return (
    normalized.match(EMAIL_REGEX)?.[0] ??
    normalized.match(EMAIL_REGEX_RELAXED)?.[0] ??
    ''
  );
}

function extractPhone(text: string): string {
  const matches = text.match(PHONE_REGEX);
  if (!matches?.length) return '';
  const normalized = matches
    .map((m) =>
      m
        .replace(/\s/g, '')
        .replace(/[()]/g, '')
        .replace(/^0/, ''),
    )
    .filter((m) => m.replace(/\D/g, '').length >= 9);
  return normalized[0] ?? '';
}

function cleanLine(line: string): string {
  let start = 0;
  let end = line.length;
  while (start < end) {
    const c = line.charAt(start);
    if (c !== '©' && c !== '®' && c !== '™' && !/\s/.test(c)) break;
    start += 1;
  }
  while (end > start) {
    const c = line.charAt(end - 1);
    if (c !== '©' && c !== '®' && c !== '™' && !/\s/.test(c)) break;
    end -= 1;
  }
  return line.slice(start, end).trim();
}

const TRAILING_CANDIDATE_PUNCT = new Set([',', ';', ':', '!', '?', '(', ')']);

function stripTrailingCandidatePunctuation(s: string): string {
  let end = s.length;
  while (end > 0 && TRAILING_CANDIDATE_PUNCT.has(s.charAt(end - 1))) {
    end -= 1;
  }
  return end === s.length ? s : s.slice(0, end);
}

function getNonEmptyLines(text: string): string[] {
  return text
    .split(/[\r\n]+/)
    .map((l) => cleanLine(l.trim()).replace(/^\(\d+\)\s*/, ''))
    .filter(
      (l) =>
        l.length > 1 &&
        !/^[\d\s\-+().]+$/.test(l) &&
        !/www\./i.test(l),
    );
}

function looksLikePhoneOnly(line: string): boolean {
  const digits = line.replace(/\D/g, '');
  return /^\+?\d[\d\s\-.]*$/.test(line.trim()) && digits.length >= 9;
}

function looksLikeEmailOrPhone(line: string): boolean {
  const normalized = line.replace(/©/g, '@');
  return (
    EMAIL_REGEX.test(normalized) ||
    EMAIL_REGEX_RELAXED.test(normalized) ||
    PHONE_REGEX.test(line) ||
    looksLikePhoneOnly(line) ||
    /[@©][a-zA-Z0-9äöüÄÖÜß]/.test(line) ||
    /^\(?\d+\)\s*.+[@©]/.test(line) ||
    /www\./i.test(line) ||
    /©\)/.test(line)
  );
}

function looksLikeAddress(line: string): boolean {
  if (line.length > 60) return true;
  return ADDRESS_INDICATORS.some((re) => re.test(line));
}

function looksLikeCompany(line: string): boolean {
  return COMPANY_INDICATORS.some((re) => re.test(line));
}

function looksLikePersonName(line: string): boolean {
  const words = line.split(/\s+/).filter((w) => w.length > 0);
  return (
    words.length >= 2 &&
    words.length <= 4 &&
    PERSON_NAME_REGEX.test(line) &&
    !looksLikeAddress(line)
  );
}

function looksLikeOcrGarbage(text: string): boolean {
  if (!text || text.length > 50) return false;
  return (
    /[|\\\/]/.test(text) ||
    /^[A-Za-z]{1,2}\s+[A-Za-z]{1,2}\s*/.test(text) ||
    /[@©]/.test(text) ||
    /^\(?\d+\)/.test(text) ||
    /www\./i.test(text) ||
    /©\)/.test(text)
  );
}

function deriveCompanyFromEmail(email: string): string {
  if (!email) return '';
  const local = email.split('@')[0];
  if (!local || local.length < 2) return '';
  const lettersOnly = local.replace(/[^a-zA-ZÇçĞğİıÖöŞşÜüäöüÄÖÜß]/g, '');
  if (lettersOnly.length < 2) return '';
  return lettersOnly.substring(0, 3).toUpperCase();
}

function deriveCompanyFromEmailDomain(email: string): string {
  if (!email) return '';
  const parts = email.replace(/©/g, '@').split('@');
  if (parts.length < 2) return '';
  const domain = parts[1]?.split('.')[0] ?? '';
  if (!domain || domain.length < 2) return '';
  const capitalized =
    domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
  return capitalized;
}

/** Extract first www.domain.tld from text */
function extractWebsite(text: string): string {
  const match = text.match(
    /www\.([a-zA-Z0-9äöüÄÖÜß\-]+)\.(?:com|de|net|org|tr|co\.uk|info|biz)/i,
  );
  return match ? match[1] ?? '' : '';
}

/** Derive company name from www.firmaadi.com → Firmaadi */
function deriveCompanyFromWebsite(text: string): string {
  const domainPart = extractWebsite(text);
  if (!domainPart || domainPart.length < 2) return '';
  return (
    domainPart.charAt(0).toUpperCase() + domainPart.slice(1).toLowerCase()
  );
}

/**
 * Derive "Ad Soyad" from email local part (@ öncesi).
 * Patterns: isim.soyisim → Sophia Wagner, i.soyisim → I Wagner, isim.s → Sophia S
 */
export function deriveNameFromEmailLocal(email: string): string {
  if (!email) return '';
  const local = email.replace(/©/g, '@').split('@')[0] ?? '';
  if (!local || local.length < 2) return '';
  const parts = local.split(/[._-]/).filter((p) => p.length > 0);
  if (parts.length < 2) return '';
  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const lettersOnly = (s: string) => s.replace(/[^a-zA-ZäöüÄÖÜßÇçĞğİıÖöŞşÜü]/g, '');
  const p1 = lettersOnly(parts[0] ?? '');
  const p2 = lettersOnly(parts[1] ?? '');
  if (p1.length >= 2 && p2.length >= 2) {
    return `${capitalize(p1)} ${capitalize(p2)}`;
  }
  if (p1.length === 1 && p2.length >= 2) {
    return `${p1.toUpperCase()} ${capitalize(p2)}`;
  }
  if (p1.length >= 2 && p2.length === 1) {
    return `${capitalize(p1)} ${p2.toUpperCase()}`;
  }
  return '';
}

function nameMatchesEmail(name: string, email: string): boolean {
  if (!name || !email) return false;
  const localPart = email.replace(/©/g, '@').split('@')[0] ?? '';
  const local = localPart.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').toLowerCase();
  const nameNorm = name.replace(/\s/g, '').toLowerCase();
  return local.length >= 4 && (local.includes(nameNorm) || nameNorm.includes(local));
}

/** Domain tabanlı firma adını kartvizitte ara; doğru yazım bulunursa onu kullan */
function searchCompanyInText(text: string, domainBase: string): string {
  if (!domainBase || domainBase.length < 2) return domainBase;
  const baseNorm = domainBase.toLowerCase().replace(/[^a-zäöüßçğıöşü]/g, '');
  if (!baseNorm) return domainBase;
  const re = new RegExp(
    `(?:^|[^a-zA-ZäöüÄÖÜßÇçĞğİıÖöŞşÜü])([A-Za-zÄÖÜäöüßÇçĞğİıÖöŞşÜü\\s-]{${baseNorm.length},35})`,
    'gi',
  );
  let m: RegExpExecArray | null;
  const candidates: string[] = [];
  while ((m = re.exec(text)) !== null) {
    const candidate = stripTrailingCandidatePunctuation((m[1] ?? '').trim());
    const cNorm = candidate.toLowerCase().replace(/[^a-zäöüßçğıöşü]/g, '');
    if (
      candidate.length >= 2 &&
      cNorm.includes(baseNorm) &&
      !looksLikeAddress(candidate) &&
      !/\d{4,}/.test(candidate)
    ) {
      candidates.push(candidate);
    }
  }
  const words = text.split(/\s+/);
  for (const w of words) {
    const wNorm = w.toLowerCase().replace(/[^a-zäöüßçğıöşü]/g, '');
    if (wNorm.length >= 3 && wNorm.includes(baseNorm)) {
      const cleaned = w.replace(/[,;:!?()]/g, '').trim();
      if (cleaned.length >= 2 && !/\d{3,}/.test(cleaned)) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
      }
    }
  }
  if (candidates.length > 0) {
    const best = candidates.find((c) => !looksLikePersonName(c)) ?? candidates[0];
    return (best ?? '').charAt(0).toUpperCase() + (best ?? '').slice(1);
  }
  return domainBase;
}

/**
 * E-posta local kısmından ipucu alıp kartvizitte eşleşen ad soyad ara.
 * sdilekci → Semih Dilekci, mehmet.tetik → Mehmet Tetik, mehmet.t → Mehmet T...
 */
function searchNameInTextFromEmailLocal(text: string, email: string): string {
  const local = (email.replace(/©/g, '@').split('@')[0] ?? '').toLowerCase();
  if (!local || local.length < 2) return '';
  const parts = local.split(/[._-]/).filter((p) => p.replace(/\d/g, '').length > 0);
  const lettersOnly = (s: string) => s.replace(/[^a-zA-ZäöüÄÖÜßÇçĞğİıÖöŞşÜü]/g, '');
  const allNames = extractNamePatternsFromText(text);

  if (parts.length >= 2) {
    const p1 = lettersOnly(parts[0] ?? '');
    const p2 = lettersOnly(parts[1] ?? '');
    if (p1.length >= 2 && p2.length >= 2) {
      const target = `${p1} ${p2}`.toLowerCase();
      const found = allNames.find(
        (n) =>
          n.toLowerCase().replace(/\s/g, '') === target.replace(/\s/g, '') ||
          (n.toLowerCase().startsWith(p1[0]?.toUpperCase() ?? '') &&
            n.toLowerCase().includes(p2)),
      );
      if (found) return found;
    }
    if (p1.length >= 2 && p2.length === 1) {
      const found = allNames.find(
        (n) =>
          n.toLowerCase().startsWith(p1.toLowerCase()) &&
          (n.split(/\s+/)[1] ?? '').toLowerCase().startsWith(p2),
      );
      if (found) return found;
    }
    if (p1.length === 1 && p2.length >= 2) {
      const found = allNames.find(
        (n) =>
          (n[0] ?? '').toLowerCase() === p1 &&
          (n.split(/\s+/)[1] ?? '').toLowerCase().startsWith(p2),
      );
      if (found) return found;
    }
  }

  const single = lettersOnly(local);
  if (single.length >= 5) {
    const firstInitial = single[0];
    const lastPart = single.slice(1);
    const found = allNames.find((n) => {
      const parts = n.split(/\s+/);
      const first = (parts[0] ?? '')[0]?.toLowerCase();
      const last = (parts[1] ?? '').toLowerCase().replace(/[^a-zäöüßçğıöşü]/g, '');
      return (
        first === firstInitial &&
        last.includes(lastPart) &&
        !looksLikeEmailOrPhone(n)
      );
    });
    if (found) return found;
  }

  return deriveNameFromEmailLocal(email);
}

/** Extract 2-word name patterns from full text (catches names in mixed lines) */
function extractNamePatternsFromText(text: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  const pattern =
    /\b([A-Za-zÄÖÜäöüßÇçĞğİıÖöŞşÜü][a-zäöüßçğıöşü]*)\s+([A-Za-zÄÖÜäöüßÇçĞğİıÖöŞşÜü][a-zäöüßçğıöşü]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    const full = `${m[1]} ${m[2]}`;
    if (
      full.length >= 4 &&
      full.length <= 50 &&
      !seen.has(full.toLowerCase()) &&
      !/\d/.test(full) &&
      !looksLikeAddress(full)
    ) {
      seen.add(full.toLowerCase());
      results.push(full);
    }
  }
  return results;
}

/**
 * Parses raw OCR text and extracts business card fields.
 * Öncelik: 1) Telefon 2) E-posta 3) Firma (@ sağı) 4) Ad Soyad (@ solu, kartta ara)
 */
export function parseBusinessCardText(text: string): ParsedBusinessCard {
  const result: ParsedBusinessCard = {
    company: '',
    name: '',
    phone: extractPhone(text),
    email: extractEmail(text),
  };

  const lines = getNonEmptyLines(text);
  const contentLines = lines.filter(
    (l) => !looksLikeEmailOrPhone(l) && !looksLikeAddress(l),
  );

  if (result.email) {
    const domainBase = deriveCompanyFromEmailDomain(result.email);
    const fromWebsite = deriveCompanyFromWebsite(text);
    const base = fromWebsite || domainBase;
    result.company = base ? searchCompanyInText(text, base) : '';
    if (!result.company) result.company = base;

    result.name = searchNameInTextFromEmailLocal(text, result.email);
  }

  const companyLine = contentLines.find((l) => looksLikeCompany(l));
  if (companyLine && !result.company) {
    result.company = companyLine;
  }

  const nonCompanyLines = contentLines.filter((l) => l !== companyLine);
  let nameCandidates = nonCompanyLines.filter((l) => looksLikePersonName(l));
  const fromText = extractNamePatternsFromText(text);
  const extra = fromText.filter(
    (n) =>
      !nameCandidates.includes(n) &&
      looksLikePersonName(n) &&
      !looksLikeEmailOrPhone(n) &&
      !looksLikeAddress(n),
  );
  nameCandidates = [...new Set([...nameCandidates, ...extra])];

  if (!result.company && nameCandidates.length >= 1) {
    const other = contentLines.filter((l) => !looksLikePersonName(l));
    result.company = companyLine ?? other[0] ?? '';
  }
  if (!result.name && nameCandidates.length >= 1) {
    const notCompany = nameCandidates.find((c) => c !== result.company);
    if (notCompany) result.name = notCompany;
    else if (result.company && !nameMatchesEmail(result.company, result.email ?? '')) {
      result.name = nameCandidates[0] ?? '';
    } else {
      result.name = nameCandidates.find((c) => !nameMatchesEmail(c, result.email ?? '')) ?? nameCandidates[0] ?? '';
    }
  }
  if (!result.name && contentLines.length >= 1) {
    const fallback = contentLines.find((l) => l !== result.company && !looksLikeAddress(l));
    if (fallback) result.name = fallback;
  }
  if (!result.name && result.email) {
    result.name = deriveNameFromEmailLocal(result.email);
  }

  if (!result.company && result.email) {
    const fromWebsite = deriveCompanyFromWebsite(text);
    const fromDomain = deriveCompanyFromEmailDomain(result.email);
    result.company = fromWebsite || fromDomain || deriveCompanyFromEmail(result.email);
  }

  if (result.company && looksLikeOcrGarbage(result.company) && result.email) {
    result.company = deriveCompanyFromEmailDomain(result.email) || deriveCompanyFromEmail(result.email);
  }

  result.company = cleanLine(result.company);
  result.name = cleanLine(result.name);

  return result;
}
