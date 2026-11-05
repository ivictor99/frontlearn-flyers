import { contactFacts, makeTemplate, roles, SIDES } from './common';
import type { Template } from '../types';

/**
 * Programme / course promotion templates.
 */

export const courseFeature: Template = makeTemplate({
  id: 'course-feature',
  name: 'Programme Spotlight',
  category: 'programme',
  description: 'Editorial split layout that puts the programme name and photo side by side.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'program', 'body', 'fee', 'duration', 'venue', 'deadline', 'cta', 'highlights', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 76, maxSize: 84 },
    subhead: { size: 32, maxSize: 36 },
  }),
  decorations: [
    { id: 'edge', kind: 'rect', x: 0, y: 0, w: 16, h: 1350, color: 'accent' },
    { id: 'soft-panel', kind: 'rect', x: 520, y: 96, w: 560, h: 430, color: 'secondary-soft', radius: 28 },
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
          w: 0.66,
          blocks: [
            { id: 'eyebrow', kind: 'text', field: 'eyebrow', role: 'eyebrow', style: { color: 'accent' } },
            { id: 'headline', kind: 'text', field: 'headline', role: 'headline', gap: 20 },
            { id: 'subhead', kind: 'text', field: 'subhead', role: 'subhead', gap: 14, style: { color: 'muted' } },
          ],
        },
        {
          w: 0.34,
          blocks: [
            {
              id: 'photo',
              kind: 'image',
              field: 'image',
              role: 'meta',
              height: 230.0,
              image: { fit: 'cover', radius: 20, focal: 'top' },
            },
          ],
        },
      ],
    },
    {
      id: 'body-block',
      flex: true,
      padX: SIDES,
      padY: 34,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'program', kind: 'text', field: 'program', role: 'label', style: { color: 'accent' } },
            { id: 'body', kind: 'text', field: 'body', role: 'body', gap: 16, priority: 7 },
            {
              id: 'highlights',
              kind: 'list',
              field: 'highlights',
              role: 'meta',
              gap: 28,
              listStyle: 'check',
              maxItems: 4,
              style: { color: 'ink' },
            },
            {
              id: 'facts',
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
              gap: 34,
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

export const courseList: Template = makeTemplate({
  id: 'course-list',
  name: 'Programme Breakdown',
  category: 'programme',
  description: 'Photo header with a highlighted card of what the programme includes.',
  aspect: 'portrait',
  fields: ['eyebrow', 'headline', 'subhead', 'program', 'body', 'fee', 'deadline', 'cta', 'bullets', 'highlights', 'image'],
  background: { kind: 'solid', color: 'paper' },
  roles: roles({
    headline: { size: 74, maxSize: 82 },
    body: { size: 25 },
  }),
  decorations: [
    { id: 'rule', kind: 'line', x: SIDES, y: 520, w: 936, h: 4, color: 'accent' },
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
      id: 'headline-block',
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
      id: 'photo',
      padX: SIDES,
      padY: 30,
      blocks: [
        {
          id: 'photo',
          kind: 'image',
          field: 'image',
          role: 'meta',
          height: 260.0,
          image: { fit: 'cover', radius: 24, focal: 'center' },
        },
      ],
    },
    {
      id: 'card',
      inset: { left: SIDES, right: SIDES },
      bg: { kind: 'solid', color: 'secondary-soft' },
      padX: 40,
      padY: 36,
      columns: [
        {
          w: 1,
          blocks: [
            { id: 'card-title', kind: 'text', text: 'What you will cover', role: 'label', style: { color: 'primary' } },
            {
              id: 'bullets',
              kind: 'list',
              field: 'bullets',
              role: 'meta',
              gap: 18,
              listStyle: 'check',
              maxItems: 5,
              style: { color: 'ink' },
            },
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
            { id: 'body', kind: 'text', field: 'body', role: 'body', priority: 7 },
            {
              id: 'facts',
              kind: 'facts',
              role: 'meta',
              gap: 30,
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
