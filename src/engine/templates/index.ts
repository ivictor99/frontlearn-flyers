import type { Template, TemplateCategory } from '../types';
import { admissionsClosing, admissionsOpen } from './admissions';
import { courseFeature, courseList } from './programmes';
import { careerConnect, eventBanner, eventPoster, seminarClean, workshopBold } from './events';
import { achievement, graduationClassic, newIntake, scholarship } from './special';
import { generalAnnouncement, promoOffer, socialSquare } from './promo';

export * from './common';

/**
 * The built-in template library.
 *
 * Adding a template means adding one file here — no renderer changes, no UI
 * changes. Every template inherits the school's brand settings automatically.
 */
export const BUILTIN_TEMPLATES: Template[] = [
  admissionsOpen,
  admissionsClosing,
  courseFeature,
  courseList,
  eventPoster,
  eventBanner,
  workshopBold,
  seminarClean,
  careerConnect,
  graduationClassic,
  scholarship,
  achievement,
  newIntake,
  promoOffer,
  generalAnnouncement,
  socialSquare,
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  admissions: 'Admissions',
  programme: 'Programmes',
  event: 'Events',
  graduation: 'Graduation',
  workshop: 'Workshops',
  seminar: 'Seminars',
  career: 'Careers',
  intake: 'Intakes',
  deadline: 'Deadlines',
  announcement: 'Announcements',
  promo: 'Promotions',
  achievement: 'Achievements',
  scholarship: 'Scholarships',
  social: 'Social',
};

export const CATEGORY_ORDER: TemplateCategory[] = [
  'admissions',
  'programme',
  'intake',
  'event',
  'workshop',
  'seminar',
  'career',
  'graduation',
  'scholarship',
  'achievement',
  'deadline',
  'promo',
  'announcement',
  'social',
];

export function templateById(templates: Template[], id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
