import type { FlyerContent, TemplateCategory } from '../types';

/**
 * Heuristic free-text parser.
 *
 * This is the always-available, offline, deterministic layer of the AI
 * assistance: it turns "Admissions are now open for our January intake…"
 * into structured content. An optional LLM can override it, but the product
 * never depends on one.
 */

export interface ParseResult {
  content: FlyerContent;
  detectedType: TemplateCategory;
  suggestedTemplateId: string;
  confidence: number;
  source: 'heuristic' | 'llm';
  /** Human-readable notes about what was understood. */
  notes: string[];
}

const CATEGORY_TEMPLATES: Record<TemplateCategory, string> = {
  admissions: 'admissions-open',
  programme: 'course-feature',
  event: 'event-poster',
  graduation: 'graduation-classic',
  workshop: 'workshop-bold',
  seminar: 'seminar-clean',
  career: 'career-connect',
  intake: 'new-intake',
  deadline: 'admissions-closing',
  announcement: 'general-announcement',
  promo: 'promo-offer',
  achievement: 'achievement-celebrate',
  scholarship: 'scholarship',
  social: 'social-square',
};

const CATEGORY_KEYWORDS: { category: TemplateCategory; weight: number; patterns: RegExp[] }[] = [
  { category: 'admissions', weight: 3, patterns: [/\badmissions?\b/i, /\bapply\b/i, /\bapplication(s)?\b/i, /\bintake\b/i, /\benroll/i] },
  { category: 'scholarship', weight: 4, patterns: [/\bscholarship/i, /\bbursar/i, /\bfinancial aid\b/i, /\bgrant\b/i] },
  { category: 'graduation', weight: 4, patterns: [/\bgraduat/i, /\bclass of\b/i, /\bcommencement\b/i] },
  { category: 'workshop', weight: 4, patterns: [/\bworkshop/i, /\bbootcamp\b/i, /\bmasterclass/i, /\btraining\b/i, /\bhands-?on\b/i] },
  { category: 'seminar', weight: 4, patterns: [/\bseminar\b/i, /\bwebinar\b/i, /\bkeynote\b/i, /\bpanel\b/i] },
  { category: 'career', weight: 4, patterns: [/\bjob\b/i, /\bcareer/i, /\bvacanc/i, /\bopportunit/i, /\binternship\b/i, /\bemployer/i] },
  { category: 'achievement', weight: 3, patterns: [/\bcongratulat/i, /\bachievement/i, /\bcelebrat/i, /\bwinner\b/i, /\bsuccess\b/i] },
  { category: 'promo', weight: 3, patterns: [/\bdiscount\b/i, /\boffer\b/i, /\bsale\b/i, /\bpromo/i, /\bfee\b/i, /\btuition\b/i] },
  { category: 'deadline', weight: 3, patterns: [/\bdeadline\b/i, /\bclosing\b/i, /\bcloses\b/i, /\blast call\b/i, /\bhurry\b/i] },
  { category: 'intake', weight: 3, patterns: [/\bintake\b/i, /\bcohort\b/i, /\bnew session\b/i] },
  { category: 'event', weight: 2, patterns: [/\bevent\b/i, /\bopen day\b/i, /\borientation\b/i, /\blaunch\b/i, /\bmeet\b/i, /\bshowcase\b/i] },
  { category: 'programme', weight: 2, patterns: [/\bdiploma\b/i, /\bcertificate\b/i, /\bcourse\b/i, /\bprogramme\b/i, /\bprogram\b/i, /\bcurriculum\b/i, /\bmodule/i, /\bqualification/i] },
  { category: 'announcement', weight: 1, patterns: [/\bannounce/i, /\bnotice\b/i, /\breminder\b/i, /\bimportant\b/i, /\binform\b/i] },
];

/** Phrases that make a good call to action. */
const CTA_PHRASES = [
  'apply now', 'apply today', 'apply for the scholarship', 'applications now open',
  'applications are now open', 'admissions are now open', 'register now', 'register today',
  'enrol now', 'enroll now', 'sign up now', 'book now', 'save your seat', 'reserve your seat',
  'get started', 'join us', 'visit us', 'download the prospectus', 'learn more', 'contact us',
  'call now', 'apply', 'register', 'enrol', 'enroll', 'rsvp',
];

/** Status phrases that work well as a kicker line. */
const EYEBROW_PHRASES = [
  'admissions open', 'admissions are open', 'applications open', 'registration open',
  'enrolment open', 'enrollment open', 'now open', 'now accepting', 'call for applications',
  'upcoming', 'important notice', 'special offer', 'limited time', 'now available', 'open now',
];

const BULLET_LEADS = [
  'including', 'features', 'what you will learn', 'what you\'ll learn', 'highlights',
  'modules', 'topics', 'agenda', 'programme includes', 'course outline', 'benefits',
  'why join', 'opportunities', 'who should attend', 'key topics', 'covers',
];

const DATE_PATTERNS = [
  /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?,?\s*\d{4})\b/i,
  /\b((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})\b/i,
  /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)[a-z]*\.?\s+\d{4})\b/i,
  /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/,
  /\b(\d{4}-\d{2}-\d{2})\b/,
];

const TIME_PATTERNS = [
  /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)\s*(?:[-–—to]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))?)\b/i,
  /\b(\d{1,2}:\d{2}\s*(?:[-–—to]+\s*\d{1,2}:\d{2}))\b/,
];

export function detectCategory(text: string): { category: TemplateCategory; confidence: number } {
  let best: TemplateCategory = 'announcement';
  let bestScore = 0;
  for (const entry of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const pattern of entry.patterns) {
      const matches = text.match(new RegExp(pattern.source, 'gi'));
      if (matches) score += entry.weight * Math.min(matches.length, 3);
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry.category;
    }
  }
  const confidence = bestScore === 0 ? 0 : Math.min(1, bestScore / 8);
  return { category: best, confidence };
}

function tidy(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.!]+$/, '').trim();
}

/** Split a line into sentences; keep single-sentence lines whole. */
function toUnits(line: string): string[] {
  const parts = line
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);
  if (parts.length > 1) return parts;
  return [line];
}

export function parseFreeText(input: string): ParseResult {
  const notes: string[] = [];
  const content: FlyerContent = {};

  if (!input.trim()) {
    return {
      content,
      detectedType: 'announcement',
      suggestedTemplateId: CATEGORY_TEMPLATES.announcement,
      confidence: 0,
      source: 'heuristic',
      notes: ['Nothing to work with yet — add some details above.'],
    };
  }

  const source = input.replace(/\r/g, '');
  const consumedValues: string[] = [];

  // --- structured fields ---------------------------------------------------
  const phone = source.match(/(?:\+?254[\s-]?|0)7\d{2}[\s-]?\d{3}[\s-]?\d{3}/)?.[0]
    ?? source.match(/\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/)?.[0];
  if (phone) {
    content.phone = tidy(phone);
    consumedValues.push(phone);
    notes.push(`Found phone: ${content.phone}`);
  }

  const email = source.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0];
  if (email) {
    content.email = email;
    consumedValues.push(email);
    notes.push(`Found email: ${email}`);
  }

  const website = source.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|org|net|io|ke|co\.ke|ac\.ke|edu|academy)\b/i)?.[0];
  if (website) {
    content.website = tidy(website);
    consumedValues.push(website);
    notes.push(`Found website: ${content.website}`);
  }

  const feeMatch =
    source.match(/(?:ksh|kes|rs\.?|price|fee|fees|tuition|cost)\s*[:\-]?\s*([\d][\d,\.]*)\s*(per\s+(?:term|month|year|semester))?/i)
    ?? source.match(/\b([\d][\d,]{2,})\s*(ksh|kes)\b/i);
  if (feeMatch) {
    const amount = feeMatch[1];
    const period = feeMatch[3] ? ` ${feeMatch[3]}` : '';
    const currency = /ksh|kes/i.test(feeMatch[0]) ? 'KSh ' : '';
    content.fee = `${currency}${amount}${period}`.trim();
    consumedValues.push(feeMatch[0]);
    notes.push(`Found fee: ${content.fee}`);
  }

  const deadlineMatch = source.match(
    /(?:deadline|closing|closes|apply before|applications close|last date)\s*(?:is|on|:)?\s*(\d{1,2}\s*(?:of\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december)[a-z]*\.?\s*\d{0,4}|(?:january|february|march|april|may|june|july|august|september|october|november|december)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  );
  if (deadlineMatch) {
    content.deadline = tidy(deadlineMatch[1]);
    consumedValues.push(deadlineMatch[1]);
    notes.push(`Found deadline: ${content.deadline}`);
  }

  let dateValue: string | null = null;
  for (const pattern of DATE_PATTERNS) {
    const match = source.match(pattern);
    if (match) {
      dateValue = tidy(match[1]);
      break;
    }
  }
  if (dateValue) {
    content.date = dateValue;
    consumedValues.push(dateValue);
    notes.push(`Found date: ${dateValue}`);
  } else if (content.deadline) {
    content.date = content.deadline;
  }

  for (const pattern of TIME_PATTERNS) {
    const match = source.match(pattern);
    if (match) {
      content.time = tidy(match[1]);
      consumedValues.push(match[1]);
      notes.push(`Found time: ${content.time}`);
      break;
    }
  }

  const venueMatch = source.match(/(?:venue|location)\s*[:\-]\s*([^.\n]{4,60})/i)
    ?? source.match(/\b(?:held at|taking place at|meet at)\s+([^.\n]{4,60})/i)
    ?? source.match(/\b(?:venue|location)\s+(?:is|will be)\s+([^.\n]{4,60})/i)
    ?? source.match(/\b(?:classes|sessions|training|workshop|event|course)\s+(?:run|take place|start|are held|will be held|are conducted)\s+(?:at|on)\s+(?:our\s+)?([^.!?\n]{4,60})/i)
    ?? source.match(/\bat\s+our\s+([^.!?\n]{4,60})/i);
  if (venueMatch) {
    content.venue = tidy(venueMatch[1]);
    consumedValues.push(venueMatch[1]);
    notes.push(`Found venue: ${content.venue}`);
  }

  // --- units ---------------------------------------------------------------
  const rawLines = source.split(/\n+/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const units: string[] = [];
  for (const line of rawLines) {
    units.push(...toUnits(line));
  }

  const lowerUnits = units.map((u) => u.toLowerCase());

  // A unit that contains nothing but a call-to-action phrase *is* the CTA.
  const isCtaOnly = (unit: string): boolean => {
    const lower = unit.toLowerCase().replace(/[.!]+$/, '').trim();
    return CTA_PHRASES.some((phrase) => lower === phrase || lower === `${phrase} now`);
  };

  const findCta = (unit: string): string | null => {
    const lower = unit.toLowerCase();
    let best: string | null = null;
    for (const phrase of CTA_PHRASES) {
      const index = lower.indexOf(phrase);
      if (index === -1) continue;
      if (!best || index < lower.indexOf(best)) best = phrase;
    }
    if (!best) return null;
    const original = unit.slice(unit.toLowerCase().indexOf(best), unit.toLowerCase().indexOf(best) + best.length);
    return original.charAt(0).toUpperCase() + original.slice(1);
  };

  const consumed = new Set<number>();
  let cta: string | null = null;
  units.forEach((unit, index) => {
    if (isCtaOnly(unit)) {
      consumed.add(index);
      if (!cta) cta = findCta(unit);
    }
  });

  // A CTA phrase embedded in a longer sentence still counts as the CTA.
  if (!cta) {
    for (const unit of units) {
      if (consumedValues.some((v) => unit.includes(v))) continue;
      const found = findCta(unit);
      if (found) {
        cta = found;
        break;
      }
    }
  }
  if (cta) {
    content.cta = cta;
    notes.push(`Found call to action: ${cta}`);
  }

  // Units that are only contact details are dropped entirely.
  units.forEach((unit, index) => {
    if (consumed.has(index)) return;
    const stripped = unit.replace(/[a-z0-9@.\-+:/\s]/gi, '');
    const withoutDetails = unit.replace(phone ?? '\u0000', '').replace(email ?? '\u0000', '').replace(website ?? '\u0000', '');
    if (withoutDetails.trim().length <= 3 && stripped.length <= 1) {
      consumed.add(index);
    }
  });

  // --- eyebrow -------------------------------------------------------------
  const eyebrowIndex = units.findIndex(
    (unit, index) =>
      !consumed.has(index) &&
      unit.length <= 40 &&
      EYEBROW_PHRASES.some((phrase) => lowerUnits[index].includes(phrase)),
  );
  if (eyebrowIndex !== -1) {
    content.eyebrow = stripTrailingPunctuation(units[eyebrowIndex]);
    consumed.add(eyebrowIndex);
    notes.push('Detected a kicker line.');
  }

  // --- headline ------------------------------------------------------------
  const headlineIndex = units.findIndex(
    (unit, index) => !consumed.has(index) && unit.length >= 4 && unit.length <= 110 && !/^[-•*–]/.test(unit),
  );
  if (headlineIndex !== -1) {
    content.headline = stripTrailingPunctuation(units[headlineIndex]);
    consumed.add(headlineIndex);
  }

  // --- programme -----------------------------------------------------------
  const programMatch = source.match(
    /\b((?:diploma|certificate|bachelor|certification)[a-z]*\s*(?:and\s+(?:diploma|certificate|bachelor)[a-z]*\s*)?(?:programmes?|programs?|courses?)?\s+(?:in|of)\s+[A-Za-z& ,]{3,40})/i,
  ) ?? source.match(
    /\b((?:short course|course|programme|program)\s+(?:in|of)\s+[A-Za-z& ,]{3,40})/i,
  ) ?? source.match(
    /\b((?:[A-Z][A-Za-z0-9&+.-]*\s+){1,3}(?:[Dd]iploma|[Cc]ertificate|[Cc]ertification|[Bb]achelor)s?)\b/,
  );
  if (programMatch) {
    content.program = tidy(programMatch[1]);
    consumedValues.push(programMatch[1]);
    notes.push(`Detected programme: ${content.program}`);
  }

  // --- subhead -------------------------------------------------------------
  const subheadIndex = units.findIndex(
    (unit, index) =>
      !consumed.has(index) &&
      unit.length >= 3 &&
      unit.length <= 90 &&
      !/[.!?]$/.test(unit) &&
      !/^[-•*–]/.test(unit) &&
      !consumedValues.some((v) => unit.includes(v)),
  );
  if (subheadIndex !== -1 && content.headline) {
    content.subhead = stripTrailingPunctuation(units[subheadIndex]);
    consumed.add(subheadIndex);
  }

  // --- bullets -------------------------------------------------------------
  const bullets: string[] = [];
  units.forEach((unit, index) => {
    if (consumed.has(index)) return;
    const marker = /^[-•*–]\s*/.test(unit);
    const lead = BULLET_LEADS.some((phrase) => lowerUnits[index].includes(phrase));
    if (marker || lead) {
      bullets.push(stripTrailingPunctuation(unit.replace(/^[-•*–]\s*/, '')));
      consumed.add(index);
    }
  });
  if (bullets.length) {
    content.bullets = bullets.slice(0, 6);
    notes.push(`Extracted ${bullets.length} bullet point${bullets.length === 1 ? '' : 's'}.`);
  }

  // --- description ---------------------------------------------------------
  const prose = units.filter(
    (unit, index) =>
      !consumed.has(index) &&
      !consumedValues.some((value) => value.length > 3 && unit.includes(value)),
  );
  if (prose.length) {
    content.body = prose.join(' ').slice(0, 420);
  }

  const { category, confidence } = detectCategory(source);
  if (!content.headline) {
    content.headline = stripTrailingPunctuation(tidy(source)).slice(0, 90);
  }

  return {
    content,
    detectedType: category,
    suggestedTemplateId: CATEGORY_TEMPLATES[category],
    confidence,
    source: 'heuristic',
    notes,
  };
}

export { CATEGORY_TEMPLATES };
