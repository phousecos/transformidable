import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrEditor } from '../access/checkRole.ts'
import {
  ACADEMY_DELIVERY,
  ACADEMY_INQUIRY_TYPES,
  ACADEMY_PARTICIPANTS,
  ACADEMY_PROGRAMS,
  ACADEMY_SECTORS,
  ACADEMY_TIMEFRAMES,
} from '../lib/academyOptions.ts'

// Inquiries from the public /academy pages: requests for a dedicated session
// for a whole governing body, and interest-list and waitlist sign-ups, told
// apart by `type`, so one list can be filtered and exported for follow-up.
// Registration and payment for open sessions happen on the class platform
// (live.betransformidable.com), not here.
export const AcademyInquiries: CollectionConfig = {
  slug: 'academy-inquiries',
  labels: { singular: 'Academy Inquiry', plural: 'Academy Inquiries' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['type', 'name', 'organization', 'course', 'status', 'submittedAt'],
    description:
      'Dedicated-session requests and interest-list sign-ups from the Academy pages. Registering interest is not enrollment.',
  },
  access: {
    // Only the /api/academy-inquiry route creates these (it validates and
    // rate-limits, and the Local API bypasses this check). Keeping public
    // create closed stops the raw REST endpoint from skipping both.
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ACADEMY_INQUIRY_TYPES,
    },
    {
      name: 'course',
      type: 'text',
      admin: { description: 'The course it was about, as code and title.' },
    },
    {
      name: 'governingBody',
      label: 'Body',
      type: 'text',
      admin: { description: 'The body they serve on, e.g. Riverbend County Board of Commissioners.' },
    },
    {
      name: 'members',
      label: 'Members',
      type: 'number',
      admin: { condition: (data) => data?.type === 'dedicated', description: 'Members of the body.' },
    },
    {
      name: 'staff',
      label: 'Staff who might join',
      type: 'number',
      admin: { condition: (data) => data?.type === 'dedicated' },
    },
    {
      name: 'preferredMonths',
      label: 'Preferred months',
      type: 'text',
      admin: { condition: (data) => data?.type === 'dedicated' },
    },
    {
      name: 'publicNotice',
      label: 'Who handles public notice',
      type: 'text',
      admin: { condition: (data) => data?.type === 'dedicated' },
    },
    {
      name: 'beta',
      type: 'checkbox',
      label: 'Beta application',
      defaultValue: false,
      admin: { description: 'Applied for the beta from the earlier Academy page.', condition: (data) => Boolean(data?.beta) },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'jobTitle',
      type: 'text',
      admin: { description: 'Role or title, as given.' },
    },
    {
      name: 'organization',
      type: 'text',
      admin: { description: 'Required for organizations, optional for individuals.' },
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'sector',
      type: 'select',
      options: ACADEMY_SECTORS,
    },
    {
      name: 'program',
      type: 'select',
      options: ACADEMY_PROGRAMS,
    },
    {
      name: 'participants',
      type: 'select',
      options: ACADEMY_PARTICIPANTS,
      admin: { condition: (data) => data?.type === 'organization' },
    },
    {
      name: 'delivery',
      type: 'select',
      options: ACADEMY_DELIVERY,
    },
    {
      name: 'timeframe',
      type: 'select',
      options: ACADEMY_TIMEFRAMES,
      admin: { condition: (data) => data?.type === 'organization' },
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'source',
      type: 'text',
      admin: { readOnly: true, description: 'The page the form was submitted from.' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal follow-up notes. Never shown publicly.' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      admin: { readOnly: true },
      hooks: { beforeValidate: [({ value }) => value || new Date().toISOString()] },
    },
  ],
}
