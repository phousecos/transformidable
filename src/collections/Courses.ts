import type { CollectionConfig, Field } from 'payload'
import { isAdmin, isAdminOrEditor } from '../access/checkRole.ts'
import { ACADEMY_AVAILABILITY, ACADEMY_BUYING_MODELS, ACADEMY_LEVELS, ACADEMY_OFFERINGS } from '../lib/academyOptions.ts'

// One Academy course. Everything the website says about a course lives here;
// dates, seats and prices come from the class platform (repo phousecos/webinar,
// live.betransformidable.com), matched by `webinarSeries`. The /academy page
// lists every listed course and /academy/courses/{slug} renders each one, so
// adding a course is adding an entry here and scheduling its sessions there.
// No page code changes.
//
// A course can be taken in an open cohort (per seat, dated in the class
// platform), as a private session for one organization, or both; the private
// session has its own format and price, since it can be in person or tailored.
//
// Text fields accept *asterisks* for italics, e.g. *Before You Vote on AI*.

const ITALICS = 'Wrap words in *asterisks* for italics.'

const textList = (name: string, label: string, description?: string): Field => ({
  name,
  label,
  type: 'array',
  admin: { description, initCollapsed: false },
  fields: [{ name: 'text', type: 'text', required: true }],
})

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Course', plural: 'Courses' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['code', 'title', 'offerings', 'availability', 'webinarSeries', 'listed'],
    description:
      'Academy courses. Dates, seats and prices are set in the class platform (live.betransformidable.com/admin); link a course to its series there with "Webinar series slug".',
  },
  defaultSort: 'sortOrder',
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Catalog',
          description: 'How the course appears on the Academy page, in the menu and in the sessions table.',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'code', type: 'text', admin: { width: '25%', description: 'e.g. TA-101. Leave blank for workshops and programs.' } },
                { name: 'title', type: 'text', required: true, admin: { width: '75%' } },
              ],
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: { description: 'The page address: /academy/courses/{slug}. Changing it breaks existing links.' },
              hooks: {
                beforeValidate: [
                  ({ value, data }) =>
                    String(value || data?.title || '')
                      .toLowerCase()
                      .replace(/['’]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, ''),
                ],
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'topicTag', label: 'Topic tag', type: 'text', required: true, admin: { width: '33%', description: 'e.g. AI, Data centers. The sessions table offers a filter when courses span more than one.' } },
                { name: 'level', type: 'select', required: true, options: ACADEMY_LEVELS, admin: { width: '33%', description: 'Internal. Shown only as the card label for workshops and programs.' } },
                {
                  name: 'offerings',
                  label: 'Ways to take it',
                  type: 'select',
                  hasMany: true,
                  options: ACADEMY_OFFERINGS,
                  admin: { width: '34%', description: 'Open cohorts list dates from the class platform; a private session offers "Plan a private session".' },
                },
              ],
            },
            // Replaced by "Ways to take it"; read once to fill it in (seed/academy.ts).
            { name: 'buyingModel', type: 'select', options: ACADEMY_BUYING_MODELS, admin: { hidden: true } },
            {
              name: 'oneLine',
              label: 'One line',
              type: 'textarea',
              required: true,
              admin: { rows: 2, description: 'The course card description.' },
            },
            {
              name: 'format',
              type: 'text',
              required: true,
              admin: { description: 'e.g. "90 minutes · live online". The buying model is added after it.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'availability',
                  type: 'select',
                  required: true,
                  defaultValue: 'scheduled',
                  options: ACADEMY_AVAILABILITY,
                  admin: { width: '50%', description: 'Coming: no dates or bookings yet; the course page offers the interest list.' },
                },
                {
                  name: 'statusLabel',
                  label: 'Status line',
                  type: 'text',
                  admin: { width: '50%', description: 'Shown when there are no dates, e.g. "Coming next", "Early 2027".' },
                },
              ],
            },
            {
              name: 'webinarSeries',
              label: 'Webinar series slug',
              type: 'text',
              admin: { description: 'The series slug in the class platform (live.betransformidable.com/{slug}). Its upcoming dates, seats and prices appear on the site within five minutes of any change there.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'priceLabel', label: 'Open cohort price line', type: 'text', admin: { width: '50%', description: 'Shown only when the class platform has no dates, e.g. "$199 founding". Otherwise built from its prices.' } },
                { name: 'creditRule', label: 'Credit rule', type: 'text', admin: { width: '50%', description: 'Internal note, e.g. "Fee credited toward any Academy course within six months".' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'listed', type: 'checkbox', defaultValue: true, admin: { width: '40%', description: 'Show on the Academy page and menu. Unlisted course pages stay reachable by link but are hidden from search.' } },
                { name: 'sortOrder', label: 'Order', type: 'number', defaultValue: 100, admin: { width: '60%', description: 'Ties and courses without dates are ordered by this, lowest first. Dated courses come first, soonest first.' } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Private session',
              admin: { condition: (data) => Array.isArray(data?.offerings) && data.offerings.includes('private') },
              fields: [
                { name: 'privateFormat', label: 'Format', type: 'text', admin: { description: 'e.g. "In person or online · tailored to your organization".' } },
                { name: 'privateTerms', label: 'Price or terms', type: 'text', admin: { description: 'e.g. "Same per-seat price · 8-seat minimum", "$8,000 per organization" or "Priced to your needs".' } },
              ],
            },
          ],
        },
        {
          label: 'Take-away',
          description: 'The card every course ends with. Shown on the Academy page and the course page.',
          fields: [
            { name: 'takeawayName', label: 'Card name', type: 'text', admin: { description: 'e.g. Before You Vote on AI' } },
            { name: 'takeawayDescription', label: 'Description', type: 'textarea', admin: { rows: 3, description: ITALICS } },
            textList('takeawayHighlights', 'Highlights', 'Short lines beside the card, e.g. "See · Decide · Own".'),
            { name: 'takeawayImage', label: 'Card image', type: 'upload', relationTo: 'media', admin: { description: 'A preview of the card. Without one, a typeset preview is shown.' } },
          ],
        },
        {
          label: 'Course page',
          description: 'Sections of /academy/courses/{slug}, top to bottom. Empty sections are left out.',
          fields: [
            {
              type: 'collapsible',
              label: 'Hero',
              fields: [
                { name: 'eyebrow', type: 'text', admin: { description: 'e.g. TA-101 · 90-minute live course' } },
                {
                  type: 'row',
                  fields: [
                    { name: 'headline', type: 'text', admin: { width: '60%', description: 'e.g. Know what you’re' } },
                    { name: 'headlineAccent', label: 'Headline accent', type: 'text', admin: { width: '40%', description: 'Shown in gold, e.g. governing.' } },
                  ],
                },
                { name: 'subhead', type: 'textarea', admin: { rows: 3 } },
                textList('facts', 'Fact row', 'Four short facts, e.g. "90 minutes, live online". The founding rate is added from the class platform.'),
              ],
            },
            {
              type: 'collapsible',
              label: 'Choose a cohort',
              admin: { description: 'The dates table. Each date’s format (online in one or two sessions, or in person) is set on the date in the class platform.' },
              fields: [
                { name: 'cohortsHeadline', label: 'Headline', type: 'text', admin: { description: 'Under "Choose a cohort", e.g. "Same workshop, three ways to sit for it." Blank: none.' } },
                { name: 'cohortsIntro', label: 'Intro', type: 'textarea', admin: { rows: 2, description: 'Blank: the Academy Page’s sessions intro.' } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Why this course',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'whyHeadline', label: 'Headline', type: 'text', admin: { width: '50%' } },
                    { name: 'whyAccent', label: 'Accent', type: 'text', admin: { width: '50%' } },
                  ],
                },
                { name: 'whyBody', label: 'Body', type: 'textarea', admin: { rows: 3, description: ITALICS } },
              ],
            },
            {
              type: 'collapsible',
              label: 'What happens in the session',
              fields: [
                { name: 'agendaEyebrow', label: 'Eyebrow', type: 'text' },
                { name: 'agendaHeadline', label: 'Headline', type: 'text' },
                { name: 'agendaNote', label: 'Note', type: 'textarea', admin: { rows: 2, description: 'Under the headline, e.g. which parts run in each session of a two-session cohort.' } },
                {
                  name: 'agenda',
                  label: 'Parts',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'minutes', type: 'number', admin: { width: '20%' } },
                        { name: 'title', type: 'text', required: true, admin: { width: '60%' } },
                        { name: 'isBreak', label: 'Break', type: 'checkbox', admin: { width: '20%', description: 'Not numbered.' } },
                      ],
                    },
                    { name: 'description', type: 'textarea', admin: { rows: 2 } },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Outcomes and take-home',
              fields: [
                { name: 'outcomesHeadline', label: 'Outcomes headline', type: 'text' },
                textList('outcomes', 'Outcomes'),
                { name: 'leaveWithHeadline', label: 'Take-home headline', type: 'text' },
                textList('leaveWith', 'You leave with', ITALICS),
                { name: 'leaveWithNote', label: 'Note under take-home', type: 'text', admin: { description: 'e.g. "Took TA-101 in the last six months? Your fee is credited toward this workshop."' } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Who it’s for and how it runs',
              fields: [
                { name: 'whoFor', label: 'Who it’s for', type: 'textarea', admin: { rows: 3 } },
                { name: 'notFor', label: 'Not for', type: 'textarea', admin: { rows: 2 } },
                textList('howItRuns', 'How it runs'),
              ],
            },
            {
              name: 'faq',
              label: 'Questions',
              type: 'array',
              admin: { description: 'The course page’s questions.' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
            {
              type: 'collapsible',
              label: 'Final call to action',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'finalHeadline', label: 'Headline', type: 'text', admin: { width: '60%' } },
                    { name: 'finalAccent', label: 'Accent', type: 'text', admin: { width: '40%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'nextCourse', label: 'Linked course', type: 'relationship', relationTo: 'courses', admin: { width: '50%', description: 'Linked below the button.' } },
                    { name: 'nextCourseLabel', label: 'Link text before its name', type: 'text', admin: { width: '50%', description: 'Blank: "Next course:". e.g. "New to AI? Start with".' } },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Search',
              fields: [
                { name: 'seoTitle', label: 'Page title', type: 'text' },
                { name: 'seoDescription', label: 'Description', type: 'textarea', admin: { rows: 2 } },
              ],
            },
          ],
        },
      ],
    },
  ],
}
