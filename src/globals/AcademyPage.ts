import type { Field, GlobalConfig } from 'payload'
import { isLoggedIn } from '../access/checkRole.ts'

// The Academy's shared copy: everything on /academy that isn't about one
// course, plus the sections every course page repeats (two ways to attend,
// instructor, the founding offer). Courses, dates, seats and prices are not
// here: they come from the Courses collection and the class platform.
//
// Text fields accept *asterisks* for italics.

const ITALICS = 'Wrap words in *asterisks* for italics.'

const headline = (prefix: string, label = 'Headline'): Field => ({
  type: 'row',
  fields: [
    { name: `${prefix}Headline`, label, type: 'text', admin: { width: '55%' } },
    { name: `${prefix}Accent`, label: 'Accent', type: 'text', admin: { width: '45%', description: 'Shown in color after the headline.' } },
  ],
})

const points: Field = {
  name: 'points',
  type: 'array',
  fields: [{ name: 'text', type: 'text', required: true }],
}

const attendCard = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', admin: { width: '40%', description: 'Small label, e.g. On your own' } },
        { name: 'badge', type: 'text', admin: { width: '20%', description: 'Optional, e.g. Most effective' } },
        { name: 'title', type: 'text', admin: { width: '40%' } },
      ],
    },
    points,
    { name: 'priceLine', label: 'Price line', type: 'text', admin: { description: ITALICS } },
    { name: 'button', label: 'Button', type: 'text' },
  ],
})

export const AcademyPage: GlobalConfig = {
  slug: 'academy-page',
  label: 'Academy Page',
  admin: {
    description: 'Shared Academy copy. Course details live in Courses; dates, seats and prices in the class platform.',
  },
  access: {
    read: () => true,
    update: isLoggedIn,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Academy page',
          fields: [
            {
              type: 'collapsible',
              label: 'Hero',
              fields: [
                { name: 'heroEyebrow', label: 'Eyebrow', type: 'text' },
                headline('hero'),
                { name: 'heroSubhead', label: 'Subhead', type: 'textarea', admin: { rows: 3 } },
                {
                  type: 'row',
                  fields: [
                    { name: 'heroPrimary', label: 'Primary button', type: 'text', admin: { width: '50%' } },
                    { name: 'heroSecondary', label: 'Secondary button', type: 'text', admin: { width: '50%' } },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Founding offer',
              fields: [
                { name: 'foundingShow', label: 'Show the founding offer', type: 'checkbox', defaultValue: true },
                headline('founding'),
                { name: 'foundingBody', label: 'Body', type: 'textarea', admin: { rows: 3 } },
                { name: 'foundingButton', label: 'Button', type: 'text' },
                { name: 'foundingLabel', label: 'Price tag', type: 'text', admin: { description: 'Beside a lower-priced date, e.g. "founding rate".' } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Courses',
              fields: [
                { name: 'coursesEyebrow', label: 'Eyebrow', type: 'text' },
                headline('courses'),
                { name: 'coursesNote', label: 'Line under the cards', type: 'text', admin: { description: ITALICS } },
                { name: 'coursesNoteLink', label: 'Link text', type: 'text', admin: { description: 'Opens the interest form, e.g. Tell us.' } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Upcoming sessions',
              fields: [
                { name: 'sessionsHeadline', label: 'Headline', type: 'text' },
                { name: 'sessionsIntro', label: 'Intro', type: 'text' },
                { name: 'waitlistLine', label: 'Waitlist line', type: 'text', admin: { description: 'Under the dates here and on course pages, e.g. "Can’t make these times?"' } },
                { name: 'waitlistLink', label: 'Waitlist link text', type: 'text' },
                { name: 'waitlistAfter', label: 'After the link', type: 'text' },
              ],
            },
            {
              type: 'collapsible',
              label: 'How the classes work',
              fields: [
                { name: 'howEyebrow', label: 'Eyebrow', type: 'text' },
                { name: 'howHeadline', label: 'Headline', type: 'text' },
                {
                  name: 'howTiles',
                  label: 'Tiles',
                  type: 'array',
                  fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'text', type: 'textarea', required: true, admin: { rows: 2 } },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'The take-away',
              fields: [
                { name: 'takeawayEyebrow', label: 'Eyebrow', type: 'text' },
                headline('takeaway'),
                { name: 'takeawayOutro', label: 'Line after the course cards', type: 'text', admin: { description: 'e.g. Each new course adds its own card.' } },
              ],
            },
            {
              type: 'collapsible',
              label: 'Questions',
              fields: [
                { name: 'faqHeadline', label: 'Headline', type: 'text' },
                {
                  name: 'faq',
                  label: 'Questions',
                  type: 'array',
                  fields: [
                    { name: 'question', type: 'text', required: true },
                    { name: 'answer', type: 'textarea', required: true },
                  ],
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Final call to action',
              fields: [headline('final'), { name: 'finalButton', label: 'Button', type: 'text' }],
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
        {
          label: 'Shared sections',
          description: 'On the Academy page and every course page.',
          fields: [
            {
              type: 'collapsible',
              label: 'Two ways to attend',
              fields: [
                { name: 'attendEyebrow', label: 'Eyebrow', type: 'text' },
                headline('attend'),
                { name: 'attendIntro', label: 'Intro', type: 'textarea', admin: { rows: 2 } },
                attendCard('attendOwn', 'On your own'),
                attendCard('attendBody', 'With your whole body'),
                { name: 'publicNoteLead', label: 'Public-body note: lead', type: 'text' },
                { name: 'publicNote', label: 'Public-body note', type: 'textarea', admin: { rows: 3 } },
              ],
            },
            {
              name: 'instructors',
              label: 'Instructors',
              type: 'array',
              admin: { description: 'One: "Your instructor". More than one: "Faculty", one card each.' },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'bio', type: 'textarea', required: true, admin: { rows: 4 } },
                { name: 'credentials', type: 'text' },
                { name: 'photo', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          label: 'Forms',
          description: 'The dedicated-session and interest-list pages.',
          fields: [
            { name: 'dedicatedEyebrow', label: 'Dedicated session: eyebrow', type: 'text' },
            { name: 'dedicatedHeadline', label: 'Dedicated session: headline', type: 'text' },
            { name: 'dedicatedIntro', label: 'Dedicated session: intro', type: 'textarea', admin: { rows: 3 } },
            { name: 'interestEyebrow', label: 'Interest list: eyebrow', type: 'text' },
            { name: 'interestHeadline', label: 'Interest list: headline', type: 'text' },
            { name: 'interestIntro', label: 'Interest list: intro', type: 'textarea', admin: { rows: 3 } },
          ],
        },
      ],
    },
  ],
}
