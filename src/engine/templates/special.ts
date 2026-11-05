import { contactFacts, makeTemplate, roles, SIDES } from './common';
import type { Template } from '../types';

/**
 * Ceremonies, scholarships, achievements and intakes.
 */

export const graduationClassic: Template = makeTemplate({
  id: 'graduation-classic',
  name: 'Graduation Ceremony',
  category: 'graduation',
  description: 'Formal centred ceremony announcement with gold accents and a laurel motif.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'time', 'venue', 'organiser', 'cta', 'reference', 'image'],
  background: { kind: 'radial', from: 'primary', to: 'ink', cx: 0.5, cy: 0.32 },
  roles: roles({
    headline: { size: 82, maxSize: 92, maxLines: 3 },
    eyebrow: { size: 22, tracking: 0.34, color: 'accent' },
    display: { size: 56 },
  }),
  decorations: [
    { id: 'laurel-left', kind: 'dots', x: 26, y: 430, w: 90, h: 460, color: 'accent', opacity: 0.55 },
    { id: 'laurel-right', kind: 'dots', x: 964, y: 430, w: 90, h: 460, color: 'accent', opacity: 0.55 },
    { id: 'ring-top', kind: 'ring', x: 470, y: 96, w: 140, h: 140, color: 'accent', opacity: 0.5, lineWidth: 3 },
    { id: 'rule-a', kind: 'line', x: 390, y: 268, w: 300, h: 2, color: 'accent', opacity: 0.7 },
    { id: 'rule-b', kind: 'line', x: 440, y: 286, w: 200, h: 1, color: 'accent', opacity: 0.45 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 40,
      align: 'center',
      blocks: [{ id: 'logo', kind: 'logo', role: 'meta', align: 'center' }],
    },
    {
      id: 'title',
      padX: SIDES,
      padY: 30,
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 20, style: { color: 'on-primary', align: 'center' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 14, style: { color: 'on-primary', opacity: 0.82, align: 'center' } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      padX: 190,
      padY: 10,
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 250.0,
          image: { fit: 'cover', radius: 12, focal: 'center' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 40,
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', style: { color: 'on-primary', opacity: 0.86, align: 'center' }, priority: 7 },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 34,
              factsColumns: 3,
              cellAlign: 'center',
              items: [
                { field: 'date', label: 'Date', icon: 'calendar' },
                { field: 'time', label: 'Time', icon: 'clock' },
                { field: 'venue', label: 'Venue', icon: 'pin' },
              ],
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
            { id: 'organiser', kind: 'text', field: 'organiser', role: 'label', gap: 26, style: { color: 'accent', align: 'center' } },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 34,
              align: 'center',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 40, paddingY: 22 },
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
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              cellAlign: 'center',
              items: contactFacts(),
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});

export const scholarship: Template = makeTemplate({
  id: 'scholarship',
  name: 'Scholarship Award',
  category: 'scholarship',
  description: 'Award announcement with eligibility list, value call-out and a golden application button.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'fee', 'deadline', 'cta', 'bullets', 'organiser', 'image'],
  background: { kind: 'linear', from: 'primary', to: 'ink', angle: 200 },
  roles: roles({
    headline: { size: 80, maxSize: 90 },
    display: { size: 96, maxSize: 110 },
  }),
  decorations: [
    { id: 'seal', kind: 'ring', x: 840, y: 110, w: 180, h: 180, color: 'accent', opacity: 0.6, lineWidth: 4 },
    { id: 'bar', kind: 'rect', x: 0, y: 0, w: 1080, h: 10, color: 'accent' },
    { id: 'dots', kind: 'dots', x: 60, y: 1090, w: 200, h: 140, color: 'accent', opacity: 0.3 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 40,
      columns: [{ w: 1, blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }] }],
    },
    {
      id: 'title',
      padX: SIDES,
      padY: 30,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 20, style: { color: 'on-primary' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 14, style: { color: 'on-primary', opacity: 0.85 } },
          ],
        },
      ],
    },
    {
      id: 'value',
      inset: { left: SIDES, right: SIDES },
      bg: { kind: 'solid', color: 'accent' },
      padX: 36,
      padY: 30,
      columns: [
        {
          w: 1,
          blocks: [
            {
              id: 'value-label',
              kind: 'text',
              text: 'Award value',
              role: 'label',
              style: { color: 'on-accent' },
            },
            { id: 'value', kind: 'text', field: 'fee', role: 'display', gap: 6, style: { color: 'on-accent', maxSize: 92 } },
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
          height: 210.0,
          image: { fit: 'cover', radius: 20, focal: 'center' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 38,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', style: { color: 'on-primary', opacity: 0.88 }, priority: 7 },
            { id: 'eligibility-label', kind: 'text', text: 'Who can apply', role: 'label', gap: 18, style: { color: 'accent' } },
            {
              id: 'eligibility',
              kind: 'list',
              field: 'bullets',
              role: 'meta',
              gap: 16,
              listStyle: 'check',
              maxItems: 4,
              style: { color: 'on-primary', iconColor: 'accent' },
            },
            {
              id: 'deadline',
              kind: 'text',
              field: 'deadline',
              role: 'meta',
              gap: 28,
              align: 'left',
              pill: true,
              pillStyle: { fill: 'on-primary', textColor: 'primary', paddingX: 24, paddingY: 14 },
              style: { color: 'primary', size: 24 },
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

export const achievement: Template = makeTemplate({
  id: 'achievement-celebrate',
  name: 'Achievement & Celebration',
  category: 'achievement',
  description: 'Celebratory announcement with a medal motif and a strong congratulations headline.',
  aspect: 'square',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'cta', 'organiser', 'image'],
  background: { kind: 'linear', from: 'secondary', to: 'primary', angle: 140 },
  roles: roles({
    headline: { size: 74, maxSize: 82, align: 'center' },
    eyebrow: { size: 22, tracking: 0.3, align: 'center' },
    display: { size: 104 },
  }),
  decorations: [
    { id: 'medal', kind: 'ring', x: 390, y: 96, w: 300, h: 300, color: 'accent', opacity: 0.35, lineWidth: 22 },
    { id: 'medal-inner', kind: 'ring', x: 450, y: 156, w: 180, h: 180, color: 'accent', opacity: 0.55, lineWidth: 3 },
    { id: 'confetti', kind: 'dots', x: 60, y: 700, w: 220, h: 220, color: 'accent', opacity: 0.3 },
    { id: 'confetti-2', kind: 'dots', x: 800, y: 760, w: 200, h: 200, color: 'accent', opacity: 0.25 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 38,
      align: 'center',
      blocks: [{ id: 'logo', kind: 'logo', role: 'meta', align: 'center' }],
    },
    {
      id: 'title',
      padX: SIDES,
      padY: 20,
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 18, style: { color: 'on-primary', align: 'center' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 12, style: { color: 'on-primary', opacity: 0.85, align: 'center' } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      inset: { left: 210, right: 210 },
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 230.0,
          image: { fit: 'cover', radius: 150, focal: 'center' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 36,
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', style: { color: 'on-primary', opacity: 0.88, align: 'center' }, priority: 7 },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 30,
              factsColumns: 2,
              cellAlign: 'center',
              items: [
                { field: 'date', label: 'Date', icon: 'calendar' },
                { field: 'organiser', label: 'Presented by', icon: 'check' },
              ],
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 32,
              align: 'center',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 40, paddingY: 22 },
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
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            {
              id: 'contact',
              kind: 'facts',
              role: 'meta',
              factsColumns: 3,
              cellAlign: 'center',
              items: contactFacts(),
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});

export const newIntake: Template = makeTemplate({
  id: 'new-intake',
  name: 'New Intake',
  category: 'intake',
  description: 'Big month treatment for intake announcements, with a programme list and deadlines.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'program', 'body', 'date', 'deadline', 'fee', 'cta', 'bullets', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 92, maxSize: 104, maxLines: 2 },
    display: { size: 76 },
    eyebrow: { size: 24 },
  }),
  decorations: [
    { id: 'panel', kind: 'rect', x: 0, y: 250, w: 1080, h: 560, color: 'primary' },
    { id: 'circle', kind: 'circle', x: 800, y: 60, w: 340, h: 340, color: 'accent', opacity: 0.22 },
    { id: 'bar', kind: 'rect', x: 0, y: 810, w: 1080, h: 8, color: 'accent' },
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
      id: 'panel-block',
      padX: SIDES,
      padY: 40,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 16, style: { color: 'on-primary' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 12, style: { color: 'on-primary', opacity: 0.86 } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      padX: SIDES,
      padY: 26,
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 230.0,
          image: { fit: 'cover', radius: 18, focal: 'center' },
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
            { id: 'program', kind: 'text', field: 'program', role: 'label', style: { color: 'accent' } },
            { id: 'body', kind: 'text', field: 'body', role: 'body', gap: 18, priority: 7 },
            {
              id: 'programmes',
              kind: 'list',
              field: 'bullets',
              role: 'meta',
              gap: 18,
              listStyle: 'dash',
              maxItems: 5,
              style: { color: 'ink' },
            },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 30,
              factsColumns: 3,
              items: [
                { field: 'date', label: 'Starts', icon: 'calendar' },
                { field: 'deadline', label: 'Apply before', icon: 'clock' },
                { field: 'fee', label: 'Tuition', icon: 'money' },
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
