import { contactFacts, makeTemplate, roles } from './common';
import type { Template } from '../types';

/**
 * Marketing and general announcement templates.
 */

export const promoOffer: Template = makeTemplate({
  id: 'promo-offer',
  name: 'Promotional Offer',
  category: 'promo',
  description: 'Price-led square flyer for discounts and limited-time offers.',
  aspect: 'square',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'fee', 'deadline', 'cta', 'bullets', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 70, maxSize: 78 },
    display: { size: 104, maxSize: 120 },
  }),
  decorations: [
    { id: 'bubble', kind: 'circle', x: 700, y: -90, w: 380, h: 380, color: 'accent-soft' },
    { id: 'frame', kind: 'rect', x: 28, y: 28, w: 1024, h: 1024, color: 'accent', opacity: 0.35, radius: 26 },
    { id: 'corner', kind: 'rect', x: 0, y: 980, w: 1080, h: 100, color: 'primary' },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: 64,
      padY: 34,
      columns: [{ w: 1, blocks: [{ id: 'logo', kind: 'logo', role: 'meta' }] }],
    },
    {
      id: 'title',
      padX: 64,
      padY: 18,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 16 },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 10, style: { color: 'muted' } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      padX: 64,
      padY: 22,
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 190.0,
          image: { fit: 'cover', radius: 18, focal: 'center' },
        },
      ],
    },
    {
      id: 'price',
      inset: { left: 64, right: 64 },
      bg: { kind: 'solid', color: 'primary' },
      padX: 32,
      padY: 24,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'price-label', kind: 'text', text: 'Special offer', role: 'label', style: { color: 'accent' } },
            { id: 'price', kind: 'text', field: 'fee', role: 'display', gap: 6, style: { color: 'on-primary', maxSize: 104 } },
          ],
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: 64,
      padY: 30,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', priority: 7 },
            {
              id: 'bullets',
              kind: 'list',
              field: 'bullets',
              role: 'meta',
              gap: 14,
              listStyle: 'check',
              maxItems: 3,
              style: { color: 'ink' },
            },
            {
              id: 'deadline',
              kind: 'text',
              field: 'deadline',
              role: 'meta',
              gap: 24,
              align: 'left',
              pill: true,
              pillStyle: { fill: 'accent-soft', textColor: 'primary', paddingX: 22, paddingY: 12 },
              style: { color: 'primary', size: 23 },
            },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 26,
              align: 'left',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 36, paddingY: 20 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      bg: { kind: 'solid', color: 'primary' },
      padX: 64,
      padY: 22,
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

export const generalAnnouncement: Template = makeTemplate({
  id: 'general-announcement',
  name: 'School Announcement',
  category: 'announcement',
  description: 'Everyday announcement card — image, headline, short note and a contact strip.',
  aspect: 'square',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'date', 'cta', 'organiser', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 62, maxSize: 70 },
    body: { size: 24 },
  }),
  decorations: [
    { id: 'rule', kind: 'line', x: 64, y: 612, w: 952, h: 3, color: 'accent' },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: 64,
      padY: 34,
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
          height: 320.0,
          image: { fit: 'cover', radius: 0, focal: 'center' },
        },
      ],
    },
    {
      id: 'title',
      padX: 64,
      padY: 28,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 14 },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 10, style: { color: 'muted' } },
          ],
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: 64,
      padY: 30,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', priority: 7 },
            {
              id: 'date',
              kind: 'text',
              field: 'date',
              role: 'meta',
              gap: 24,
              align: 'left',
              pill: true,
              pillStyle: { fill: 'primary', textColor: 'on-primary', paddingX: 22, paddingY: 12 },
              style: { color: 'on-primary', size: 23 },
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
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      padX: 64,
      padY: 22,
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

export const socialSquare: Template = makeTemplate({
  id: 'social-square',
  name: 'Social Square',
  category: 'social',
  description: 'Minimal bold square for Instagram, Facebook and WhatsApp status updates.',
  aspect: 'square',
  fields: ['eyebrow', 'headline', 'subhead', 'body', 'cta', 'date', 'image'],
  background: { kind: 'solid', color: 'primary' },
  roles: roles({
    headline: { size: 82, maxSize: 92, align: 'center', maxLines: 4 },
    eyebrow: { size: 22, tracking: 0.28, align: 'center' },
    subhead: { size: 30, align: 'center' },
  }),
  decorations: [
    { id: 'topbar', kind: 'rect', x: 0, y: 0, w: 1080, h: 12, color: 'accent' },
    { id: 'ring', kind: 'ring', x: 760, y: 700, w: 260, h: 260, color: 'accent', opacity: 0.25, lineWidth: 18 },
  ],
  bands: [
    {
      id: 'brand-bar',
      pin: 'top',
      padX: 64,
      padY: 40,
      align: 'center',
      blocks: [{ id: 'logo', kind: 'logo', role: 'meta', align: 'center' }],
    },
    {
      id: 'title',
      padX: 64,
      padY: 40,
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 20, style: { color: 'on-primary', align: 'center' } },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 14, style: { color: 'on-primary', opacity: 0.85, align: 'center' } },
          ],
        },
      ],
    },
    {
      id: 'photo',
      inset: { left: 240, right: 240 },
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 190.0,
          image: { fit: 'cover', radius: 125, focal: 'center' },
        },
      ],
    },
    {
      id: 'detail',
      flex: true,
      padX: 64,
      padY: 32,
      align: 'center',
      columns: [
        {
          w: 1,
          align: 'center',
          blocks: [
            { id: 'body', kind: 'text', field: 'body', role: 'body', style: { color: 'on-primary', opacity: 0.82, align: 'center' }, priority: 7 },
            {
              id: 'cta',
              kind: 'cta',
              field: 'cta',
              role: 'cta',
              gap: 30,
              align: 'center',
              pillStyle: { fill: 'accent', textColor: 'on-accent', paddingX: 38, paddingY: 20 },
            },
          ],
        },
      ],
    },
    {
      id: 'footer',
      pin: 'bottom',
      padX: 64,
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
              factsColumns: 2,
              cellAlign: 'center',
              items: [
                { field: 'website', label: 'Web', icon: 'globe' },
                { field: 'phone', label: 'Call', icon: 'phone' },
              ],
              factColors: { label: 'on-primary', value: 'on-primary', icon: 'accent' },
            },
          ],
        },
      ],
    },
  ],
});
