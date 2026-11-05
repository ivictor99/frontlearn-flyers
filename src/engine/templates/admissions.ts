import { contactFacts, makeTemplate, roles, SIDES } from './common';
import type { Template } from '../types';

/**
 * Admissions templates.
 *
 * "Admissions Open" — the workhorse: colour hero, photo band, facts, CTA.
 * "Closing Soon" — urgency-led variant built around the deadline date.
 */

export const admissionsOpen: Template = makeTemplate({
  id: 'admissions-open',
  name: 'Admissions Open',
  category: 'admissions',
  description: 'Colour-blocked admissions flyer with a photo band, key facts and a prominent call to action.',
  aspect: 'portrait',
  fields: [
    'eyebrow', 'headline', 'subhead', 'program', 'body',
    'date', 'venue', 'fee', 'deadline', 'cta', 'highlights', 'organiser', 'image',
  ],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 84, maxSize: 92, minSize: 40 },
    subhead: { size: 34, maxSize: 40 },
  }),
  decorations: [
    { id: 'accent-bar', kind: 'rect', x: 0, y: 0, w: 1080, h: 10, color: 'accent' },
    { id: 'hero-glow', kind: 'circle', x: 720, y: 150, w: 460, h: 460, color: 'accent-soft', opacity: 0.75 },
    { id: 'hero-dots', kind: 'dots', x: 60, y: 300, w: 150, h: 150, color: 'accent', opacity: 0.35 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 40,
      align: 'right',
      blocks: [{ id: 'logo', kind: 'logo', role: 'meta', align: 'right' }],
    },
    {
      id: 'hero',
      bg: { kind: 'solid', color: 'primary' },
      padX: SIDES,
      padY: 56,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 22, style: { color: 'on-primary' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 16, style: { color: 'on-primary', opacity: 0.86 } },
            {
              id: 'hero-facts',
              kind: 'facts',
              role: 'meta',
              gap: 38,
              factsColumns: 2,
              items: [
                { field: 'date', label: 'Start date', icon: 'calendar' },
                { field: 'venue', label: 'Location', icon: 'pin' },
              ],
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
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
          height: 320.0,
          image: { fit: 'cover', radius: 0, focal: 'center' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 48,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'program', kind: 'text', field: 'program', role: 'label', style: { color: 'accent' } },
            { id: 'body', kind: 'text', field: 'body', role: 'body', gap: 16, priority: 6 },
            {
              id: 'highlights',
              kind: 'list',
              field: 'highlights',
              role: 'meta',
              gap: 30,
              listStyle: 'check',
              maxItems: 4,
              style: { color: 'ink' },
            },
            {
              id: 'fee-facts',
              kind: 'facts',
              role: 'meta',
              gap: 32,
              factsColumns: 2,
              items: [
                { field: 'fee', label: 'Tuition', icon: 'money' },
                { field: 'deadline', label: 'Apply before', icon: 'calendar' },
              ],
              priority: 4,
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 38,
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
      padY: 28,
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

export const admissionsClosing: Template = makeTemplate({
  id: 'admissions-closing',
  name: 'Applications Closing',
  category: 'admissions',
  description: 'Urgency-led flyer that makes the deadline impossible to miss.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'program', 'body', 'deadline', 'venue', 'fee', 'cta', 'highlights', 'image'],
  background: { kind: 'linear', from: 'primary', to: 'secondary', angle: 160 },
  roles: roles({
    headline: { size: 80, maxSize: 88 },
    display: { size: 128, maxSize: 150, weight: 800 },
    body: { size: 26 },
  }),
  decorations: [
    { id: 'ring', kind: 'ring', x: 760, y: 120, w: 320, h: 320, color: 'accent', opacity: 0.28, lineWidth: 26 },
    { id: 'corner', kind: 'rect', x: 0, y: 1280, w: 1080, h: 70, color: 'accent' },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: SIDES,
      padY: 40,
      columns: [
        {
          w: 1,
          blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }],
        },
      ],
    },
    {
      id: 'headline-block',
      padX: SIDES,
      padY: 40,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 22, style: { color: 'on-primary' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 16, style: { color: 'on-primary', opacity: 0.85 } },
          ],
        },
      ],
    },
    {
      id: 'deadline',
      padX: SIDES,
      padY: 20,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'deadline-label', kind: 'text', text: 'Applications close', role: 'label', style: { color: 'accent' } },
            { id: 'deadline-value', kind: 'text', field: 'deadline', role: 'display', gap: 8, style: { color: 'on-primary', maxSize: 132 } },
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
          height: 250.0,
          image: { fit: 'cover', radius: 0, focal: 'top' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: SIDES,
      padY: 44,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', priority: 7 },
            {
              id: 'highlights',
              kind: 'list',
              field: 'highlights',
              role: 'meta',
              gap: 26,
              listStyle: 'dot',
              maxItems: 4,
              style: { color: 'on-primary', iconColor: 'accent' },
            },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 30,
              factsColumns: 2,
              items: [
                { field: 'venue', label: 'Location', icon: 'pin' },
                { field: 'fee', label: 'Tuition', icon: 'money' },
              ],
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
              priority: 4,
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 34,
              align: 'left',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 42, paddingY: 22 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      bg: { kind: 'solid', color: 'ink', opacity: 0.28 },
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
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});
