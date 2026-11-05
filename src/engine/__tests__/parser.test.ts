import { describe, expect, it } from 'vitest';
import { parseFreeText } from '../parser/heuristics';

describe('free-text parser', () => {
  it('understands a prose announcement', () => {
    const result = parseFreeText(
      'Admissions are now open for our January intake. We offer diploma and certificate programs in ICT. Applications close December 20.',
    );
    expect(result.detectedType).toBe('admissions');
    expect(result.content.headline).toBeTruthy();
    expect(result.content.program).toMatch(/Diploma/i);
    expect(result.content.deadline).toMatch(/December 20/i);
    expect(result.suggestedTemplateId).toBe('admissions-open');
  });

  it('understands a list of bullet facts', () => {
    const result = parseFreeText(
      [
        'Admissions Open',
        'January 2027 Intake',
        'AI Programming Diploma',
        'Applications now open',
        'Call 0712 345 678',
        'www.frontlearn.ac.ke',
      ].join('\n'),
    );
    expect(result.content.eyebrow).toBe('Admissions Open');
    expect(result.content.headline).toBe('January 2027 Intake');
    expect(result.content.subhead).toMatch(/AI Programming Diploma/i);
    expect(result.content.cta).toMatch(/Applications now open/i);
    expect(result.content.phone).toMatch(/0712/);
    expect(result.content.website).toMatch(/frontlearn/i);
  });

  it('extracts fee, time and venue', () => {
    const result = parseFreeText(
      'Advanced Welding Workshop. Venue: Main Campus, Nairobi. Time: 9:00 AM - 4:00 PM. Price: KSh 12,500 per term. Register now.',
    );
    expect(result.content.fee).toMatch(/12,500/);
    expect(result.content.time).toMatch(/9:00/);
    expect(result.content.venue).toMatch(/Nairobi/i);
    expect(result.content.cta).toMatch(/Register now/i);
  });

  it('detects the flyer type', () => {
    expect(parseFreeText('Scholarship applications for the 2027 cohort are now open').detectedType).toBe('scholarship');
    expect(parseFreeText('Graduation ceremony for the class of 2026').detectedType).toBe('graduation');
    expect(parseFreeText('Job fair and career opportunities day').detectedType).toBe('career');
    expect(parseFreeText('Career workshop on CV writing').detectedType).toBe('workshop');
  });

  it('returns an empty result for empty input', () => {
    const result = parseFreeText('   ');
    expect(result.confidence).toBe(0);
    expect(Object.keys(result.content)).toHaveLength(0);
  });
  it('reads a plain message with dates, venue, fee and programme', () => {
    const result = parseFreeText(
      [
        'Frontlearn Institute is running a free online coding bootcamp for January 2027.',
        'The programme is a 12 week AI Programming Diploma and it starts on 20 January 2027 at 9:00 AM.',
        'Classes run at our Main Campus, Nairobi.',
        'The fee is KSh 25,000 per term and applications close on 20 December 2026.',
        'Call us on 0712 345 678 or email admissions@frontlearn.ac.ke.',
      ].join('\n'),
    );
    expect(result.content.date).toBe('20 January 2027');
    expect(result.content.time).toBe('9:00 AM');
    expect(result.content.venue).toBe('Main Campus, Nairobi');
    expect(result.content.program).toBe('AI Programming Diploma');
    expect(result.content.deadline).toBe('20 December 2026');
    expect(result.content.email).toBe('admissions@frontlearn.ac.ke');
    expect(result.suggestedTemplateId).toBeTruthy();
  });

  it('never throws on unusual input', () => {
    expect(() => parseFreeText('2027')).not.toThrow();
    expect(() => parseFreeText('am pm')).not.toThrow();
    expect(() => parseFreeText('')).not.toThrow();
  });
});
