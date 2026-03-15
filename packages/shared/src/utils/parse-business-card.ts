/**
 * Parses raw OCR text from a business card image and extracts
 * company name, contact name, phone, and email.
 */

export interface ParsedBusinessCard {
  company: string;
  name: string;
  phone: string;
  email: string;
}

const EMAIL_REGEX =
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

// Turkish phone formats: +90 5xx xxx xx xx, 05xx xxx xx xx, 5xx xxx xx xx
const PHONE_REGEX =
  /(?:\+90\s?)?(?:0?)?5[0-9]{2}\s?[0-9]{3}\s?[0-9]{2}\s?[0-9]{2}|(?:\+90\s?)?(?:0?)?5[0-9]{2}[0-9]{7}/g;

// Company indicators (Ltd, A.Ş., Inc, etc.)
const COMPANY_INDICATORS = [
  /\b(?:ltd|limited|a\.?ş\.?|inc\.?|gmbh|san\.?\s*ve\s*tic\.?)\b/i,
  /\b(?:holding|grup|group|company|co\.?)\b/i,
];

function extractEmail(text: string): string {
  const match = text.match(EMAIL_REGEX);
  return match?.[0] ?? '';
}

function extractPhone(text: string): string {
  const matches = text.match(PHONE_REGEX);
  if (!matches?.length) return '';
  const normalized = matches
    .map((m) => m.replace(/\s/g, '').replace(/^0/, ''))
    .filter((m) => m.length >= 10);
  return normalized[0] ?? '';
}

function getNonEmptyLines(text: string): string[] {
  return text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !/^[\d\s\-+().]+$/.test(l));
}

function looksLikeEmailOrPhone(line: string): boolean {
  return EMAIL_REGEX.test(line) || PHONE_REGEX.test(line);
}

function looksLikeCompany(line: string): boolean {
  return COMPANY_INDICATORS.some((re) => re.test(line));
}

/**
 * Parses raw OCR text and extracts business card fields.
 * Uses heuristics: email/phone via regex, company/name via line order.
 */
export function parseBusinessCardText(text: string): ParsedBusinessCard {
  const result: ParsedBusinessCard = {
    company: '',
    name: '',
    phone: extractPhone(text),
    email: extractEmail(text),
  };

  const lines = getNonEmptyLines(text);
  const contentLines = lines.filter((l) => !looksLikeEmailOrPhone(l));

  if (contentLines.length === 0) return result;

  const companyLine = contentLines.find((l) => looksLikeCompany(l));
  if (companyLine) {
    result.company = companyLine;
  }

  const nonCompanyLines = contentLines.filter((l) => l !== companyLine);

  if (nonCompanyLines.length >= 1 && !result.company) {
    result.company = nonCompanyLines[0] ?? '';
  }
  if (nonCompanyLines.length >= 2) {
    const nameCandidate = result.company
      ? nonCompanyLines.find((l) => l !== result.company)
      : nonCompanyLines[1];
    if (nameCandidate && nameCandidate.length >= 2 && nameCandidate.length <= 50) {
      result.name = nameCandidate;
    }
  }
  if (!result.name && nonCompanyLines.length >= 1) {
    result.name = nonCompanyLines.find((l) => l !== result.company) ?? '';
  }
  if (!result.company && result.name) {
    result.company = result.name;
    result.name = '';
  }

  return result;
}
