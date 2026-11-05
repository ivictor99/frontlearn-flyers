import { contactFacts, makeTemplate, roles, SIDES } from './common';
import type { Template } from '../types';

/**
 * Event-style templates: posters, banners, workshops, seminars and careers.
 */

export const eventPoster: Template = makeTemplate({
  id: 'event-poster',
  name: 'Event Poster',
  category: 'event',
  description: 'Photo-led poster with an overlapping date badge — ideal for social posts.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'time', 'venue', 'cta', 'organiser', 'highlights', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 80, maxSize: 90 },
    number: { size: 46, maxSize: 54, weight: 800 },
  }),
  decorations: [
    { id: 'tape', kind: 'rect', x: 900, y: 46, w: 240, h: 16, color: 'accent', rotation: -12 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 36,
      columns: [{ w: 1, blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }] }],
    },
    {
      id: 'photo',
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 400.0,
          image: { fit: 'cover', radius: 0, focal: 'center' },
        },
      ],
    },
    {
      id: 'date-badge',
      padX: SIDES,
      padY: 0,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'date',
              kind: 'text',
              field: 'date',
              role: 'label',
              align: 'left',
              pill: true,
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 26, paddingY: 16 },
              style: { color: 'on-accent', size: 26, tracking: 0.1 },
            },
          ],
        },
      ],
    },
    {
      id: 'title',
      padX: SIDES,
      padY: 26,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 18 },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 12, style: { color: 'muted' } },
          ],
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 34,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: [
                { field: 'time', label: 'Time', icon: 'clock' },
                { field: 'venue', label: 'Venue', icon: 'pin' },
                { field: 'organiser', label: 'Host', icon: 'check' },
              ],
            },
            { id: 'body', kind: 'text', field: 'body', role: 'body', gap: 28, priority: 7 },
            {
              id: 'highlights',
              kind: 'list',
              field: 'highlights',
              role: 'meta',
              gap: 22,
              listStyle: 'dash',
              maxItems: 4,
              style: { color: 'ink' },
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 30,
              align: 'left',
              pillStyle: { fill: 'primary', textColor: 'on-primary', paddingX: 40, paddingY: 22 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      padX: SIDES,
      padY: 24,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: contactFacts(),
              factColors: { label: 'muted', value: 'ink', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});

export const eventBanner: Template = makeTemplate({
  id: 'event-banner',
  name: 'Event Banner',
  category: 'event',
  description: 'Wide banner for website announcements and email headers.',
  aspect: 'landscape',
  fields: ['eyebrow', 'headline', 'subhead', 'date', 'time', 'venue', 'cta', 'image'],
  background: { kind: 'solid', color: 'primary' },
  roles: roles({
    headline: { size: 62, maxSize: 68, maxLines: 3 },
    subhead: { size: 28, maxSize: 30 },
    eyebrow: { size: 22 },
  }),
  decorations: [
    { id: 'shape', kind: 'circle', x: 940, y: -120, w: 380, h: 380, color: 'accent', opacity: 0.16 },
  ],
  bands: [
    {
      id: 'content',
      padX: 64,
      padY: 54,
      columns: [
        {
          w: 0.58,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 14, style: { color: 'on-primary' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 10, style: { color: 'on-primary', opacity: 0.85 } },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 24,
              factsColumns: 3,
              items: [
                { field: 'date', label: 'Date', icon: 'calendar' },
                { field: 'time', label: 'Time', icon: 'clock' },
                { field: 'venue', label: 'Venue', icon: 'pin' },
              ],
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 26,
              align: 'left',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 34, paddingY: 18 },
            },
          ],
        },
        {
          w: 0.42,
          blocks: [
            {
              id: 'photo',
              kind: 'image',
              field: 'image',
              role: 'meta',
              height: 400.0,
              image: { fit: 'cover', radius: 18, focal: 'center' },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      bg: { kind: 'solid', color: 'ink', opacity: 0.3 },
      padX: 64,
      padY: 20,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: contactFacts(),
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});

export const workshopBold: Template = makeTemplate({
  id: 'workshop-bold',
  name: 'Workshop Steps',
  category: 'workshop',
  description: 'Numbered training steps with a strong accent band — good for practical sessions.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'time', 'venue', 'fee', 'cta', 'bullets', 'organiser', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 78, maxSize: 86 },
  }),
  decorations: [
    { id: 'corner-shape', kind: 'rect', x: 760, y: 0, w: 320, h: 260, color: 'accent', rotation: 12 },
    { id: 'dots', kind: 'dots', x: 60, y: 1180, w: 180, h: 120, color: 'accent', opacity: 0.3 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 38,
      columns: [{ w: 1, blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }] }],
    },
    {
      id: 'headline-block',
      bg: { kind: 'solid', color: 'primary' },
      padX: SIDES,
      padY: 52,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 18, style: { color: 'on-primary' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 14, style: { color: 'on-primary', opacity: 0.85 } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 230.0,
          image: { fit: 'cover', radius: 0, focal: 'top' },
        },
      ],
    },
    {
      id: 'steps',
      flex: true,
      padX: SIDES,
      padY: 40,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'steps-label', kind: 'text', text: 'What you will learn', role: 'label', style: { color: 'accent' } },
            {
              id: 'steps',
              kind: 'list',
              field: 'bullets',
              role: 'meta',
              gap: 20,
              listStyle: 'number',
              maxItems: 5,
              style: { color: 'ink' },
            },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 32,
              factsColumns: 3,
              items: [
                { field: 'date', label: 'Date', icon: 'calendar' },
                { field: 'time', label: 'Time', icon: 'clock' },
                { field: 'venue', label: 'Venue', icon: 'pin' },
              ],
              priority: 4,
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 32,
              align: 'left',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 40, paddingY: 22 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      bg: { kind: 'solid', color: 'secondary' },
      padX: SIDES,
      padY: 24,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: contactFacts(),
              factColors: { label: 'on-secondary', value: 'on-secondary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});

export const seminarClean: Template = makeTemplate({
  id: 'seminar-clean',
  name: 'Seminar Notice',
  category: 'seminar',
  description: 'Quiet editorial layout with generous white space and hairline rules.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'organiser', 'date', 'time', 'venue', 'cta', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { family: 'heading', size: 72, maxSize: 78, weight: 700 },
    eyebrow: { size: 20, tracking: 0.24 },
    body: { size: 25 },
  }),
  decorations: [
    { id: 'hairline', kind: 'line', x: SIDES, y: 300, w: 936, h: 2, color: 'ink', opacity: 0.18 },
    { id: 'accent-hairline', kind: 'line', x: SIDES, y: 300, w: 180, h: 3, color: 'accent' },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 44,
      columns: [{ w: 1, blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }] }],
    },
    {
      id: 'headline-block',
      padX: SIDES,
      padY: 54,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 22 },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 14, style: { color: 'muted' } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      padX: SIDES,
      padY: 20,
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 230.0,
          image: { fit: 'cover', radius: 12, focal: 'center' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 40,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', priority: 7 },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 34,
              factsColumns: 3,
              items: [
                { field: 'date', label: 'Date', icon: 'calendar' },
                { field: 'time', label: 'Time', icon: 'clock' },
                { field: 'venue', label: 'Venue', icon: 'pin' },
              ],
            },
            { id: 'organiser', kind: 'text', field: 'organiser', role: 'label', gap: 26, style: { color: 'muted' } },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 30,
              align: 'left',
              pillStyle: { fill: 'primary', textColor: 'on-primary', paddingX: 36, paddingY: 20 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      padX: SIDES,
      padY: 26,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: contactFacts(),
              factColors: { label: 'muted', value: 'ink', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});

export const careerConnect: Template = makeTemplate({
  id: 'career-connect',
  name: 'Career & Jobs',
  category: 'career',
  description: 'Opportunity-led flyer with a grid of roles and a registration call to action.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'time', 'venue', 'cta', 'bullets', 'highlights', 'organiser', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 76, maxSize: 84 },
  }),
  decorations: [
    { id: 'side-stripe', kind: 'rect', x: 0, y: 0, w: 1080, h: 8, color: 'accent' },
    { id: 'panel', kind: 'rect', x: SIDES, y: 690, w: 936, h: 520, color: 'secondary-soft', radius: 26 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 38,
      columns: [{ w: 1, blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }] }],
    },
    {
      id: 'headline-block',
      padX: SIDES,
      padY: 24,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 18 },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 12, style: { color: 'muted' } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      padX: SIDES,
      padY: 28,
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 240.0,
          image: { fit: 'cover', radius: 22, focal: 'center' },
        },
      ],
    },
    {
      id: 'opportunities',
      inset: { left: SIDES, right: SIDES },
      padX: 40,
      padY: 36,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'opp-label', kind: 'text', text: 'Opportunities available', role: 'label', style: { color: 'primary' } },
            {
              id: 'opps',
              kind: 'list',
              field: 'bullets',
              role: 'meta',
              gap: 18,
              listStyle: 'check',
              maxItems: 5,
              style: { color: 'ink' },
            },
            { id: 'body', kind: 'text', field: 'body', role: 'body', gap: 24, priority: 7 },
          ],
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 36,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: [
                { field: 'date', label: 'Date', icon: 'calendar' },
                { field: 'time', label: 'Time', icon: 'clock' },
                { field: 'venue', label: 'Venue', icon: 'pin' },
              ],
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 30,
              align: 'left',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 40, paddingY: 22 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      bg: { kind: 'solid', color: 'primary' },
      padX: SIDES,
      padY: 24,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              items: contactFacts(),
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});
