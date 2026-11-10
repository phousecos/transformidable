import type { Payload } from 'payload'

// First-run content for the Academy (Courses and the Academy Page global),
// from "Academy Website Redesign: Structure and Copy" (Nov 10, 2026).
//
// Runs on every deploy but only fills what has never been set: courses only
// when the collection is empty, and the global only before it is first
// saved. Edits and deletions in the admin are never overwritten.
//
// upgradeCourses() brings courses made before "Ways to take it" existed up to
// date, once each (a course whose Ways to take it is still empty).
//
// Left out on purpose until decided (open items in the copy doc): the
// transfer/refund and continuing-education answers, TA-102's title (seeded
// unlisted), the instructor photo and the take-away card image (uploads).

const list = (items: string[]) => items.map((text) => ({ text }))

const TA101 = {
  code: 'TA-101',
  title: 'Know What You’re Governing',
  slug: 'know-what-youre-governing',
  topicTag: 'AI',
  level: 'foundations',
  offerings: ['open', 'private'],
  privateFormat: 'Online or in person · can be tailored to your body’s agenda',
  privateTerms: 'Same per-seat price · 8-seat minimum',
  oneLine: 'What AI is, where it shows up, how it goes wrong, and six questions to ask before you vote.',
  format: '90 minutes · live online',
  availability: 'scheduled',
  statusLabel: 'Founding cohorts open',
  webinarSeries: 'know-what-youre-governing',
  priceLabel: '$199 founding ($249)',
  creditRule: 'Fee credited toward any Academy course within six months; credit follows whoever paid.',
  listed: true,
  sortOrder: 10,

  takeawayName: 'Before You Vote on AI',
  takeawayDescription:
    'TA-101 ends with *Before You Vote on AI*: six governance questions, six more for your pocket, and six red flags to listen for in a staff memo or vendor pitch.',
  takeawayHighlights: list(['See · Decide · Own', 'Escalate · Evidence · Respond']),

  eyebrow: 'TA-101 · 90-minute live course',
  headline: 'Know what you’re',
  headlineAccent: 'governing.',
  subhead:
    'AI fundamentals for legislators, council members, commissioners and board members. You won’t learn to build AI. You’ll learn what to ask before you approve it.',
  facts: list(['90 minutes, live online', '16–20 officials per cohort', 'No technical background']),

  whyHeadline: 'AI is already on your agenda.',
  whyAccent: 'Often it isn’t labelled.',
  whyBody:
    'It arrives inside a software renewal, a vendor upgrade, a grant, or a tool staff started using last spring. You are accountable for it either way. TA-101 gives you the vocabulary and the questions to govern it, in one sitting.',

  agendaEyebrow: 'What happens in the 90 minutes',
  agendaHeadline: 'Ninety minutes, five parts',
  agenda: [
    { minutes: 20, title: 'What AI actually is', description: 'See why fluent answers aren’t always correct, in a live demo and a quick poll.' },
    { minutes: 12, title: 'Where AI shows up', description: 'Learn the five shapes of AI and the four doors it comes through, including the ones that skip your agenda.' },
    { minutes: 15, title: 'What can go wrong', description: 'Walk through four real public-sector cases and the seven ways AI fails.' },
    { minutes: 10, title: 'Governing vs. managing', description: 'Learn six governance disciplines and one question for each.' },
    { minutes: 18, title: 'The agenda item', description: 'Work a fictional staff memo in a small group and take a position: approve, approve with conditions, or table.' },
  ],

  outcomesHeadline: 'By the end, you’ll be able to',
  outcomes: list([
    'Explain what AI is, in plain words',
    'Recognize where AI shows up in your organization',
    'Name seven ways AI goes wrong',
    'Tell governing AI apart from managing it',
    'Ask six governance questions',
    'Take a defensible position on an AI agenda item',
  ]),
  leaveWithHeadline: 'You leave with',
  leaveWith: list([
    'The *Before You Vote on AI* card (12 questions and 6 red flags)',
    'Participant guide with glossary',
    'Certificate of completion',
    'Your fee credited toward any Academy course within six months',
  ]),

  whoFor:
    'Legislators and legislative staff leads, city and county council members, county commissioners, school board members, authority and commission appointees, and public-entity and nonprofit board members.',
  notFor: 'Technical teams looking to build or configure AI. TA-101 is about decisions, not code.',
  howItRuns: list([
    'Live in our virtual classroom; works in Chrome, Edge or Safari on a laptop or desktop.',
    'Not recorded. Captions on. Cameras optional except in the small-group breakout.',
    'Mixed cohorts: officials from different jurisdictions and body types, so the questions are better.',
  ]),

  faq: [
    {
      question: 'How much does it cost?',
      answer:
        '$249 per seat; $199 for founding cohorts. Your fee is credited toward any Academy course within six months; if your organization paid, the credit goes to your organization.',
    },
    {
      question: 'Can my organization pay by invoice or purchase order?',
      answer: 'Yes. Tell us when you register and we’ll send an invoice to the contact you name.',
    },
    { question: 'Do I need a technical background?', answer: 'No. The course is built for decision-makers, not technologists.' },
    { question: 'Is the session recorded?', answer: 'No. Officials speak more freely without a recording.' },
    {
      question: 'Could this count as a public meeting?',
      answer:
        'If a majority of your body attends together, it might. Tell us when you register and we’ll coordinate with your clerk, or set up a dedicated session. This is not legal advice.',
    },
    {
      question: 'What comes after TA-101?',
      answer: 'Governing AI Adoption, a 4-hour private workshop for your organization. Or see the other Academy courses.',
    },
  ],

  finalHeadline: 'Your next AI vote is coming.',
  finalAccent: 'Be ready for it.',
  seoTitle: 'TA-101 AI Fundamentals for Public Officials | Transformidable Academy',
  seoDescription:
    'A 90-minute live course for city and county councils, commissions, legislatures and school boards: what AI is, where it shows up, how it goes wrong, and what to ask before you approve it.',
}

// The workshop and the applied program: catalog fields plus page copy from
// the earlier Academy site, so their course pages say what is covered.
const WORKSHOP_PAGE = {
  eyebrow: 'Workshop · half day · private for your organization',
  headline: 'Governing AI',
  headlineAccent: 'adoption.',
  subhead:
    'An interactive workshop that helps governing bodies and executive teams turn AI awareness into practical governance expectations.',
  facts: list(['Half day, or two online sessions', 'For one organization', 'Adapted to your sector']),
  whyHeadline: 'Understanding AI is only the beginning.',
  whyAccent: 'Governing it is the work.',
  whyBody:
    'As organizations introduce AI, leaders must decide who has authority to make decisions, how risks are evaluated, what evidence supports deployment, and when concerns require escalation. Using realistic scenarios, your team works through the decisions, responsibilities and oversight needed to govern AI adoption.',
  outcomesHeadline: 'What you’ll work through',
  outcomes: list([
    'Establishing AI decision rights and accountability',
    'Evaluating proposed AI uses against your objectives and risk',
    'Distinguishing operational management from governance oversight',
    'Identifying the information leaders need before authorizing AI initiatives',
    'Designing escalation, monitoring and reporting expectations',
    'Developing priorities for the next 90 days',
  ]),
  leaveWithHeadline: 'You leave with',
  leaveWith: list(['A preliminary AI Governance Oversight Scorecard', 'A 90-Day Governance Action Plan for your organization']),
  whoFor: 'Governing boards, councils, executive teams, CIOs, AI program sponsors, and leaders responsible for organizational risk and accountability.',
  howItRuns: list([
    'Four hours, as a half-day session or two online sessions.',
    'Adapted to your sector, the AI already in use, and your governance responsibilities.',
  ]),
  finalHeadline: 'Move beyond AI awareness.',
  finalAccent: 'Govern what comes next.',
  seoTitle: 'Governing AI Adoption: a private workshop | Transformidable Academy',
  seoDescription:
    'A half-day private workshop that helps governing bodies and executive teams set AI decision rights, oversight and reporting, and leave with a 90-day governance action plan.',
}

const APPLIED_PAGE = {
  eyebrow: 'Applied program · about a full day · private',
  headline: 'Build AI governance',
  headlineAccent: 'in practice.',
  subhead:
    'An applied program that helps your leaders build a working approach to governing AI, from first evaluation through ongoing oversight, with your own people and systems.',
  facts: list(['About seven hours', 'For one organization', 'Applied to your own context']),
  whyHeadline: 'A policy is not a governance approach.',
  whyAccent: 'Clear authority is.',
  whyBody:
    'Effective AI governance needs clear authority, defined accountability, reliable information, and the ability to respond when circumstances change. Participants work through governance scenarios and apply structured decision tools to their own organization.',
  outcomesHeadline: 'What you’ll work through',
  outcomes: list([
    'Defining AI governance roles and decision-making authority',
    'Setting requirements for evaluating proposed AI uses',
    'Assigning accountability across leadership, technology, legal, risk and operations',
    'Designing escalation and exception-management processes',
    'Identifying the evidence governance decisions need',
    'Setting oversight measures, reporting expectations and review cycles',
    'Developing an implementation roadmap',
  ]),
  leaveWithHeadline: 'You leave with',
  leaveWith: list(['An AI Governance Action Brief: priorities, decision rights, oversight expectations and next steps']),
  whoFor: 'Executive leaders, governance and risk professionals, AI program sponsors, CIOs, and teams responsible for establishing or strengthening AI governance.',
  howItRuns: list(['About seven hours of facilitated instruction and applied exercises.', 'Delivered privately for your organization.']),
  finalHeadline: 'Turn governance principles',
  finalAccent: 'into a plan.',
  seoTitle: 'Building AI Governance in Practice | Transformidable Academy',
  seoDescription:
    'An applied program for leadership teams to define AI decision rights, accountability, escalation and oversight, and leave with an AI Governance Action Brief.',
}

const WORKSHOP = {
  title: 'Governing AI Adoption',
  slug: 'governing-ai-adoption',
  topicTag: 'AI',
  level: 'workshop',
  offerings: ['private'],
  privateFormat: 'Half day in person, or two online sessions · adapted to your organization',
  privateTerms: '$8,000 per organization',
  oneLine: 'Turn the questions into decisions, accountability and oversight for your organization.',
  format: 'Half day',
  availability: 'scheduled',
  statusLabel: 'Available for your organization',
  creditRule: 'Course credits apply, capped at 25% of the fee ($2,000).',
  listed: true,
  sortOrder: 20,
  ...WORKSHOP_PAGE,
}

const APPLIED = {
  title: 'Building AI Governance in Practice',
  slug: 'building-ai-governance',
  topicTag: 'AI',
  level: 'applied',
  offerings: ['private'],
  privateFormat: 'About a full day, in person or online · built around your own systems',
  privateTerms: 'Priced to your organization',
  oneLine: 'Build your organization’s working governance approach, with your own people and systems.',
  format: 'About a full day',
  availability: 'coming',
  statusLabel: 'Coming next',
  listed: true,
  sortOrder: 30,
  ...APPLIED_PAGE,
}

const TA102 = {
  code: 'TA-102',
  title: 'Data centers (working title)',
  slug: 'ta-102',
  topicTag: 'Data centers',
  level: 'foundations',
  offerings: ['open', 'private'],
  privateTerms: 'Same per-seat price · 8-seat minimum',
  oneLine: 'What to ask before you approve a data center: power, water, land use, tax incentives and community impact.',
  format: '90 minutes · live online',
  availability: 'coming',
  statusLabel: 'Early 2027',
  priceLabel: '$199 founding',
  // Unlisted until it has a title.
  listed: false,
  sortOrder: 40,
}

// What upgradeCourses() fills in, by slug, on courses made before Ways to
// take it. Only empty fields are filled.
const UPGRADES: Record<string, Record<string, unknown>> = {
  [TA101.slug]: { offerings: TA101.offerings, privateFormat: TA101.privateFormat, privateTerms: TA101.privateTerms },
  [WORKSHOP.slug]: { ...WORKSHOP_PAGE, offerings: WORKSHOP.offerings, privateFormat: WORKSHOP.privateFormat, privateTerms: WORKSHOP.privateTerms, availability: 'scheduled', statusLabel: WORKSHOP.statusLabel },
  [APPLIED.slug]: { ...APPLIED_PAGE, offerings: APPLIED.offerings, privateFormat: APPLIED.privateFormat, privateTerms: APPLIED.privateTerms },
  [TA102.slug]: { offerings: TA102.offerings, privateTerms: TA102.privateTerms },
}

const isEmpty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0)

/** Fills Ways to take it, the private session and missing page copy, once per course. */
async function upgradeCourses(payload: Payload): Promise<void> {
  const { docs } = await payload.find({ collection: 'courses', limit: 200, depth: 0 })
  for (const c of docs as Record<string, any>[]) {
    if (!isEmpty(c.offerings)) continue
    const known = UPGRADES[c.slug] || {}
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(known)) {
      // The workshop's old "Private" availability and status line are replaced outright.
      if (isEmpty(c[k]) || (c.slug === WORKSHOP.slug && (k === 'availability' || k === 'statusLabel'))) data[k] = v
    }
    if (isEmpty(data.offerings)) data.offerings = c.buyingModel === 'per-seat' ? ['open', 'private'] : ['private']
    if (c.availability === 'private') data.availability = 'scheduled'
    await payload.update({ collection: 'courses', id: c.id, data: data as any })
    console.log(`[seed:academy] Upgraded ${c.slug}.`)
  }
}

const ACADEMY_PAGE = {
  heroEyebrow: 'Transformidable Academy',
  heroHeadline: 'Govern technology.',
  heroAccent: 'No technical background required.',
  heroSubhead:
    'Live, small-group courses for the councils, commissions, legislatures and boards that approve and oversee technology. Learn what to ask, what a good answer sounds like, and when to say “not yet.”',
  heroPrimary: 'See upcoming sessions',
  heroSecondary: 'Bring your whole board',

  foundingShow: true,
  foundingHeadline: 'Founding cohorts:',
  foundingAccent: '$199 a seat',
  foundingBody:
    'Every new foundations course opens with founding cohorts at $199 (regular $249). Founding participants help shape what comes next, and your fee is credited toward any Academy course within six months.',
  foundingButton: 'Reserve a founding seat',
  foundingLabel: 'founding rate',

  coursesEyebrow: 'Courses',
  coursesHeadline: 'Start with 90 minutes.',
  coursesAccent: 'Go deeper when your organization is ready.',
  coursesNote: 'Is your body being asked to approve something we don’t cover yet?',
  coursesNoteLink: 'Tell us.',

  sessionsHeadline: 'Upcoming sessions',
  sessionsIntro: 'All sessions are live online and capped at 20 people. Times shown in Eastern; your confirmation shows your local time.',
  waitlistLine: 'Can’t make these times?',
  waitlistLink: 'Join the waitlist',
  waitlistAfter: 'and we’ll tell you when new dates open.',

  howEyebrow: 'How the classes work',
  howHeadline: 'Built for people who hold the vote',
  howTiles: [
    { title: 'Small and live', text: '16 to 20 officials per cohort, from different jurisdictions. No pre-recorded lectures.' },
    { title: 'Practice, not slides', text: 'Work a realistic agenda item in a small group and decide: approve, approve with conditions, or table.' },
    { title: 'Safe to speak', text: 'Sessions are not recorded, and every scenario is fictional.' },
    { title: 'Something to keep', text: 'Every course ends with a one-page take-away card of questions and red flags.' },
  ],

  takeawayEyebrow: 'The take-away',
  takeawayHeadline: 'Every course ends with a card',
  takeawayAccent: 'you’ll actually use.',
  takeawayOutro: 'Each new course adds its own card.',

  faqHeadline: 'Questions officials ask',
  faq: [
    {
      question: 'How much does it cost, and can we pay by invoice?',
      answer:
        '$249 per seat; $199 for founding cohorts. Tell us when you register and we’ll invoice the contact you name. Your fee is credited toward any Academy course within six months; if your organization paid, the credit goes to your organization.',
    },
    { question: 'Do I need a technical background?', answer: 'No. The course is built for decision-makers, not technologists.' },
    { question: 'Is the session recorded?', answer: 'No. Officials speak more freely without a recording.' },
    {
      question: 'Could this count as a public meeting?',
      answer:
        'If a majority of your body attends together, it might. Tell us when you register and we’ll coordinate with your clerk, or set up a dedicated session. This is not legal advice.',
    },
    { question: 'Can our whole board attend together?', answer: 'Yes, in a dedicated session at the same per-seat price, with an 8-seat minimum.' },
  ],

  finalHeadline: 'Your next technology vote is coming.',
  finalAccent: 'Be ready for it.',
  finalButton: 'See upcoming sessions',
  seoTitle: 'Transformidable Academy | Technology Governance Courses for Public Officials',
  seoDescription:
    'Live, small-group courses for city and county councils, commissions, legislatures and school boards that approve and oversee technology. No technical background required.',

  attendEyebrow: 'Two ways to attend',
  attendHeadline: 'Come on your own.',
  attendAccent: 'Or bring the whole body.',
  attendIntro:
    'Anyone can take a seat in an open session. Governing bodies get the most from it when everyone at the table hears the same questions at the same time.',
  attendOwn: {
    label: 'On your own',
    title: 'Join an open session',
    points: list([
      'Register for one seat, on a date that suits you',
      'Learn alongside officials from other jurisdictions',
      'Pay by card, or have your organization invoiced',
    ]),
    priceLine: '$249 per seat · $199 founding',
    button: 'See upcoming sessions',
  },
  attendBody: {
    label: 'With your whole body',
    badge: 'Most effective',
    title: 'A dedicated session for your board',
    points: list([
      'Everyone at the table leaves with the same vocabulary and the same questions',
      'Invite the staff who bring AI items forward, so memos start answering the questions',
      'Scheduled on your calendar; your clerk notices it under your own rules',
    ]),
    priceLine: 'Same per-seat price · 8-seat minimum',
    button: 'Plan a session for your board',
  },
  publicNoteLead: 'A note for public bodies.',
  publicNote:
    'If a quorum of your body plans to attend together, the session may need public notice under open meetings law. Tell us when you register and we’ll work with your clerk or attorney. This is not legal advice.',

  instructors: [
    {
      name: 'Dr. Jerri Bland',
      bio: 'Jerri has spent 25+ years on the inside of large institutional technology decisions, including the ones that went wrong. As Deputy CIO at Columbia University and Assistant Vice Chancellor for Enterprise Applications at UNC–Chapel Hill, she led systems that answered to executive steering committees, and helped recover a troubled $42M implementation. She teaches officials what she wishes every board had asked her.',
      credentials: 'Ed.D. · PMP · CSM · ITIL Foundation · Lead researcher, Transformidable Research',
    },
  ],

  dedicatedEyebrow: 'Dedicated sessions',
  dedicatedHeadline: 'Plan a session for your board',
  dedicatedIntro:
    'Everyone at the table hears the same questions at the same time, on your calendar. Same per-seat price, with an 8-seat minimum; smaller bodies fill the remaining seats with key staff. Tell us about your body and we’ll propose dates.',
  interestEyebrow: 'Interest list',
  interestHeadline: 'Tell us what you need',
  interestIntro:
    'Join the waitlist for new dates, the interest list for a course that’s coming, or tell us what your body is being asked to approve. We’ll be in touch when there’s something to offer.',
}

export async function seedAcademy(payload: Payload): Promise<void> {
  const courses = await payload.count({ collection: 'courses' })
  if (courses.totalDocs === 0) {
    const workshop = await payload.create({ collection: 'courses', data: WORKSHOP as any })
    await payload.create({ collection: 'courses', data: APPLIED as any })
    await payload.create({ collection: 'courses', data: TA102 as any })
    await payload.create({ collection: 'courses', data: { ...TA101, nextCourse: workshop.id } as any })
    console.log('[seed:academy] Courses created.')
  }
  await upgradeCourses(payload)

  const page = (await payload.findGlobal({ slug: 'academy-page', depth: 0 })) as { heroHeadline?: string }
  if (!page?.heroHeadline) {
    await payload.updateGlobal({ slug: 'academy-page', data: ACADEMY_PAGE as any })
    console.log('[seed:academy] Academy Page filled.')
  }
}
