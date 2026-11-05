import { useEffect, useRef, useState } from 'react';
import { paintFlyer } from '@engine/export';
import { ASPECTS } from '@engine/brand';
import type { BrandConfig, FlyerContent, Template } from '@engine/types';

interface TemplateThumbProps {
  template: Template;
  brand: BrandConfig;
  content?: FlyerContent;
  className?: string;
  /** Only render when the card is visible — keeps long galleries snappy. */
  active?: boolean;
}

/** Demo copy so every template in the gallery shows its intended design. */
export const DEMO_CONTENT: FlyerContent = {
  eyebrow: 'Admissions open',
  headline: 'January 2027 Intake',
  subhead: 'AI Programming Diploma',
  body: 'Hands-on training, industry placement and flexible payment options for every student.',
  program: 'Diploma in ICT',
  date: '20 January 2027',
  time: '9:00 AM',
  venue: 'Main Campus, Nairobi',
  fee: 'KSh 25,000',
  deadline: '20 December 2026',
  cta: 'Apply now',
  highlights: ['Industry placement', 'Flexible payment', 'Certified trainers'],
  bullets: ['Networking', 'Certifications', 'Mentorship', 'Digital skills'],
  organiser: 'Admissions Office',
  reference: 'FL-ADM-2027',
};

const PER_TEMPLATE: Record<string, FlyerContent> = {
  'admissions-closing': { ...DEMO_CONTENT, headline: 'Applications close 20 Dec', deadline: '20 December 2026' },
  'course-feature': { ...DEMO_CONTENT, headline: 'Diploma in ICT', body: 'A two-year programme covering networking, programming, hardware and cyber security.' },
  'course-list': { ...DEMO_CONTENT, headline: 'Diploma in ICT', bullets: ['Networking fundamentals', 'Programming with Python', 'Cyber security basics', 'Database design', 'Cloud fundamentals'] },
  'event-poster': { ...DEMO_CONTENT, headline: 'Career Open Day', subhead: 'Meet employers and trainers', time: '9:00 AM – 4:00 PM' },
  'event-banner': { ...DEMO_CONTENT, headline: 'Career Open Day', subhead: 'Meet employers and trainers' },
  'workshop-bold': { ...DEMO_CONTENT, headline: 'Advanced Welding Workshop', subhead: 'Hands-on training for fabricators' },
  'seminar-clean': { ...DEMO_CONTENT, headline: 'Digital Skills Seminar', organiser: 'ICT Department' },
  'career-connect': { ...DEMO_CONTENT, headline: 'Career & Job Opportunities', bullets: ['Software intern', 'IT support', 'Graphic designer', 'Account assistant'] },
  'graduation-classic': { ...DEMO_CONTENT, eyebrow: 'Graduation ceremony', headline: 'Class of 2026', subhead: 'Frontlearn Institute', organiser: 'Academic Board' },
  scholarship: { ...DEMO_CONTENT, eyebrow: 'Scholarship 2027', headline: 'Full Tuition Scholarship', fee: 'KSh 60,000', bullets: ['Open to final-year students', 'Minimum 70% average', 'Apply before 30 November'] },
  'achievement-celebrate': { ...DEMO_CONTENT, eyebrow: 'Congratulations', headline: 'Our Top Student of 2026', subhead: 'Frontlearn Institute', organiser: 'Academic Board' },
  'new-intake': { ...DEMO_CONTENT, headline: 'January 2027', subhead: 'New intake now open', bullets: ['Diploma in ICT', 'Diploma in Business', 'Certificate in Graphics'] },
  'promo-offer': { ...DEMO_CONTENT, eyebrow: 'Limited offer', headline: 'Tuition Discount', fee: 'KSh 18,500', deadline: '20 December 2026' },
  'general-announcement': { ...DEMO_CONTENT, eyebrow: 'Important notice', headline: 'School Reopens on 12 January' },
  'social-square': { ...DEMO_CONTENT, headline: 'January 2027 Intake', subhead: 'Applications now open' },
};

/**
 * A small rendering of a template used in the gallery and picker.
 * It is a real render, not a screenshot, so it always matches the template.
 */
export function TemplateThumb({ template, brand, content, className, active = true }: TemplateThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const aspect = ASPECTS[template.aspect];
    const scale = Math.min(0.34, 260 / aspect.width);
    let cancelled = false;

    const draw = async () => {
      if (typeof document !== 'undefined' && 'fonts' in document) {
        try {
          await document.fonts.ready;
        } catch {
          /* optional */
        }
      }
      if (cancelled) return;
      try {
        await paintFlyer(canvas, {
          template,
          brand,
          content: content ?? PER_TEMPLATE[template.id] ?? DEMO_CONTENT,
          scale,
        });
      } catch {
        /* ignore */
      }
    };

    if (visible) void draw();
    return () => {
      cancelled = true;
    };
  }, [template, brand, content, visible]);

  const aspect = ASPECTS[template.aspect];

  return (
    <div
      className={className}
      ref={(node) => {
        if (node && !visible) {
          const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              setVisible(true);
              observer.disconnect();
            }
          });
          observer.observe(node);
        }
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ aspectRatio: `${aspect.width} / ${aspect.height}` }}
        aria-label={`${template.name} example`}
      />
    </div>
  );
}
