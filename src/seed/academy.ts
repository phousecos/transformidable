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
// transfer/refund and continuing-education answers, the final TA-102 title
// (seeded unlisted as Know What You're Siting), the instructor photo and the
// take-away card images (uploads).

const list = (items: string[]) => items.map((text) => ({ text }))

// TA-101's agenda once added up to 75 of its 90 minutes; this part closes the gap.
const TA101_QA = {
  minutes: 15,
  title: 'Questions and next steps',
  description: 'Bring the AI items on your own agenda. Open questions, then what to do before your next vote.',
}
const TA101_OLD_NEXT_ANSWER = 'Governing AI Adoption, a 4-hour private workshop for your organization. Or see the other Academy courses.'
const TA101_NEXT_ANSWER =
  'TA-201 Governing AI Adoption, a four-hour live workshop in open cohorts or for your whole board. Your TA-101 fee is credited toward it.'

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
  agendaHeadline: 'Ninety minutes, six parts',
  agenda: [
    { minutes: 20, title: 'What AI actually is', description: 'See why fluent answers aren’t always correct, in a live demo and a quick poll.' },
    { minutes: 12, title: 'Where AI shows up', description: 'Learn the five shapes of AI and the four doors it comes through, including the ones that skip your agenda.' },
    { minutes: 15, title: 'What can go wrong', description: 'Walk through four real public-sector cases and the seven ways AI fails.' },
    { minutes: 10, title: 'Governing vs. managing', description: 'Learn six governance disciplines and one question for each.' },
    { minutes: 18, title: 'The agenda item', description: 'Work a fictional staff memo in a small group and take a position: approve, approve with conditions, or table.' },
    TA101_QA,
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
      answer: TA101_NEXT_ANSWER,
    },
  ],

  finalHeadline: 'Your next AI vote is coming.',
  finalAccent: 'Be ready for it.',
  seoTitle: 'TA-101 AI Fundamentals for Public Officials | Transformidable Academy',
  seoDescription:
    'A 90-minute live course for city and county councils, commissions, legislatures and school boards: what AI is, where it shows up, how it goes wrong, and what to ask before you approve it.',
}

// The applied program: catalog fields plus page copy from the earlier Academy
// site, so its course page says what is covered.
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

// TA-201: the four-hour workshop, in open cohorts (online in one or two
// sessions, or in person; each date's format is set in the class platform) or
// for one body. From the course page mockup of Nov 14, 2026.
const WORKSHOP_PAGE = {
  code: 'TA-201',
  topicTag: 'AI',
  level: 'workshop',
  offerings: ['open', 'private'],
  privateFormat: 'Tailored to your group',
  privateTerms: 'We scope it with you and send a proposal',
  oneLine: 'Turn AI awareness into the decision rights, evidence and oversight your body needs before and after it approves AI.',
  format: '4 hours · live, online or in person',
  availability: 'scheduled',
  statusLabel: 'Founding cohorts open',
  webinarSeries: 'governing-ai-adoption',
  priceLabel: '$549 per seat · $449 founding',
  creditRule: 'A TA-101 fee paid in the last six months is credited; credit follows whoever paid.',
  listed: true,
  sortOrder: 20,

  eyebrow: 'Transformidable Academy · TA-201 · Live workshop',
  headline: 'Govern what you’ve',
  headlineAccent: 'adopted.',
  subhead:
    'A four-hour live workshop for legislators, council members, commissioners, and board members. It turns AI awareness into the decision rights, evidence, and oversight your body needs before and after it approves AI.',
  facts: list(['4 hours, live · one half day or two sessions', '16–20 officials · online or in person', 'TA-101 recommended, not required']),

  cohortsHeadline: 'Same workshop, three ways to sit for it.',
  cohortsIntro:
    'Every cohort covers the full four hours. Pick the format that fits your calendar: one online half day, two shorter online sessions a week apart, or in person. Capped at 20. All times Eastern.',

  whyHeadline: 'The vote is where',
  whyAccent: 'governing AI starts.',
  whyBody:
    'After approval, contracts renew, vendors add features, staff widen the use, and a pilot quietly becomes the default. Your body is still accountable for all of it. This workshop gives you the structure: who decides, what evidence you require, and when an issue comes back to you. You’ll practice it on realistic scenarios, not slides.',

  agendaEyebrow: 'Agenda',
  agendaHeadline: 'Four hours, six parts.',
  agendaNote: 'In two-session cohorts, parts 1–3 run in session one and parts 4–6 in session two.',
  agenda: [
    { minutes: 35, title: 'Who decides', description: 'Map who can approve, buy, and switch on AI in your organization, and find the gaps where no one is accountable.' },
    { minutes: 40, title: 'Is this use worth it?', description: 'Screen proposed AI uses against your objectives and risk, then test the screen on a fictional staff proposal.' },
    { minutes: 30, title: 'Governing, not managing', description: 'Draw the line between governance oversight and operational management: what your body owns and what staff own.' },
    { minutes: 15, title: 'Break', isBreak: true },
    { minutes: 35, title: 'Before you say yes', description: 'Specify the information and evidence leaders need before authorizing an AI initiative, and how to ask for it.' },
    { minutes: 40, title: 'When it comes back to you', description: 'Set escalation, monitoring, and reporting expectations. Tabletop exercise: an AI problem surfaces between meetings.' },
    { minutes: 45, title: 'Your next 90 days', description: 'Score your current oversight and set priorities. Each participant leaves with a draft scorecard and action plan.' },
  ],

  outcomesHeadline: 'By the end, you’ll be able to',
  outcomes: list([
    'Assign AI decision rights and accountability',
    'Screen a proposed AI use against objectives and risk',
    'Separate governance oversight from operational management',
    'Name the evidence you need before authorizing AI',
    'Set escalation, monitoring, and reporting expectations',
    'Set your body’s AI governance priorities for the next 90 days',
  ]),
  leaveWithHeadline: 'What you leave with',
  leaveWith: list([
    'The AI Governance Oversight Scorecard, with a preliminary score of where your oversight stands today',
    'A 90-Day Governance Action Plan, drafted in the room (completed for your body in dedicated sessions)',
    'Participant guide with scenarios, worksheets and glossary',
    'Certificate of completion',
  ]),
  leaveWithNote: 'Took TA-101 in the last six months? Your fee is credited toward this workshop.',

  whoFor:
    'Legislators and legislative staff leads, city and county council members, county commissioners, school board members, authority and commission appointees, and public-entity and nonprofit board members, plus the executives and CIOs who report to them. Best if you’ve taken TA-101 or already know the AI basics.',
  notFor: 'Technical teams that want to build or configure AI. New to AI? Start with TA-101.',
  howItRuns: list([
    'Four hours, as one half day or two 2-hour sessions',
    'Live online (Chrome, Edge, or Safari on a laptop or desktop) or in person',
    'Not recorded; captions on',
    'Cameras on for scenario work',
    'Open cohorts mix jurisdictions and body types',
    'Dedicated sessions adapt to your sector and the AI already in use',
  ]),

  faq: [
    {
      question: 'What does it cost?',
      answer:
        '$549 per seat, or $449 in founding cohorts. A TA-101 fee paid in the last six months is credited. If your organization paid, the credit goes to the organization. Dedicated sessions are priced to your group.',
    },
    {
      question: 'Do I need TA-101 first?',
      answer: 'It’s recommended but not required. This workshop assumes you know what AI is and where it shows up. TA-101 covers both in 90 minutes.',
    },
    {
      question: 'One session or two: which should I pick?',
      answer: 'The content is the same. Two sessions are easier to fit around meetings; one half day keeps the scenario work together.',
    },
    { question: 'Can my organization pay by invoice?', answer: 'Yes, by invoice or purchase order. Tell us when you register.' },
    { question: 'Is it recorded?', answer: 'No, so officials can speak freely.' },
    {
      question: 'Could it count as a public meeting?',
      answer: 'Possibly, if a majority of your body attends together. Coordinate with your clerk, or request a dedicated session. This is not legal advice.',
    },
    {
      question: 'What comes next?',
      answer: 'Building AI Governance in Practice, or a dedicated advisory engagement through Transformidable Advisory.',
    },
  ],

  finalHeadline: 'You approved it.',
  finalAccent: 'Now govern it.',
  nextCourseLabel: 'New to AI? Start with',
  seoTitle: 'TA-201 Governing AI Adoption: a live workshop for public officials | Transformidable Academy',
  seoDescription:
    'A four-hour live workshop, online or in person, for councils, commissions, legislatures and boards: AI decision rights, evidence before approval, escalation and oversight, and a 90-day governance plan.',
}

const WORKSHOP = {
  title: 'Governing AI Adoption',
  slug: 'governing-ai-adoption',
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

// TA-102: data centers, from "Data Centers for Public Officials — Course
// Outline" (Nov 13, 2026). Nonpartisan by design: benefits and concerns get
// equal parts, and the course never recommends approve or deny. Unlisted
// until its title is final; its dates come from the class platform.
const TA102_PAGE = {
  code: 'TA-102',
  title: 'Know What You’re Siting',
  slug: 'know-what-youre-siting',
  topicTag: 'Data centers',
  level: 'foundations',
  offerings: ['open', 'private'],
  privateFormat: 'Online · can be tailored to the proposal in front of your body',
  privateTerms: 'Same per-seat price · 8-seat minimum',
  oneLine: 'What data centers are, what they bring, and what they cost, so any proposal can be tested on its merits.',
  format: '2 hours · live online',
  availability: 'coming',
  statusLabel: 'Early 2027',
  webinarSeries: 'know-what-youre-siting',
  priceLabel: '$199 founding ($249)',
  creditRule: 'Fee credited toward any Academy course within six months; credit follows whoever paid.',
  sortOrder: 15,

  takeawayName: 'Before You Vote on a Data Center',
  takeawayDescription:
    'TA-102 ends with *Before You Vote on a Data Center*: ten questions that test any proposal on its own merits, and six gaps to look for in the record.',
  takeawayHighlights: list(['Megawatts · Water · Tariff', 'Jobs · Revenue · Disclosure']),

  eyebrow: 'TA-102 · 2-hour live course',
  headline: 'Know what you’re',
  headlineAccent: 'siting.',
  subhead:
    'A fair, factual foundation for any data center decision that reaches your agenda. What data centers are, what they bring, and what they cost. The course takes no position on whether any community should host one.',
  facts: list(['2 hours, live online', '16–20 officials per cohort', 'Nonpartisan · no position on any proposal']),

  whyHeadline: 'Data center proposals are reaching local agendas.',
  whyAccent: 'The numbers rarely come with both sides.',
  whyBody:
    'A proposal arrives with an economic impact study, a water figure and a jobs number. Residents arrive with other numbers. This course gives you the vocabulary, the evidence on both sides, and the questions that test a proposal on its own merits, whatever position your body ends up taking.',

  agendaEyebrow: 'What happens in the two hours',
  agendaHeadline: 'Two hours, six parts',
  agendaNote: 'Benefits and concerns each get their own part, so neither is presented as the rebuttal to the other.',
  agenda: [
    { minutes: 20, title: 'What a data center actually is', description: 'Follow one everyday action, a video call or an online tax payment, to the building that serves it. Quick poll: how many data centers did you use today?' },
    { minutes: 10, title: 'Shapes and sizes', description: 'Enterprise, colocation, hyperscale, edge and AI campuses, and why megawatts, not square feet, is the number to ask for.' },
    { minutes: 20, title: 'What a community can gain', description: 'Tax base, construction and operations jobs, supplier spending and infrastructure commitments, and how to read an economic impact study.' },
    { minutes: 30, title: 'What a community weighs', description: 'Electricity and rates, water, land, noise and backup generators, incentives and transparency: what the evidence shows and where it’s still contested.' },
    { minutes: 10, title: 'Who decides what', description: 'Local zoning and permits, the utility, the state regulator and state incentives, and where your body has leverage.' },
    { minutes: 25, title: 'The agenda item', description: 'In small groups, review a fictional proposal and staff memo, and list the evidence missing before anyone could vote. There is no right vote, only a complete or incomplete record.' },
    { minutes: 5, title: 'Wrap and questions', isBreak: true },
  ],

  outcomesHeadline: 'By the end, you’ll be able to',
  outcomes: list([
    'Explain in plain words what a data center is, and how the main types differ in size and footprint',
    'Describe the benefits a community can gain: tax base, jobs, supplier spending, infrastructure investment',
    'Describe the concerns communities raise: electricity and rates, water, land and noise, incentives, transparency',
    'Tell a claim from evidence in a developer’s, advocate’s or utility’s numbers',
    'Name which decisions sit with your body and which with utilities, regulators or the state',
    'Ask ten questions that test any proposal on its own merits',
  ]),
  leaveWithHeadline: 'You leave with',
  leaveWith: list([
    'The *Before You Vote on a Data Center* card (10 questions and 6 gaps to look for)',
    'A Who Decides What worksheet to fill in for your own jurisdiction',
    'A plain-language glossary, from megawatt to PILOT',
    'Certificate of completion',
    'Your fee credited toward any Academy course within six months',
  ]),

  whoFor:
    'Legislators and legislative staff leads, city and county council members, county commissioners, planning and zoning boards, utility and authority boards, and economic development boards.',
  notFor: 'Anyone looking for a case for or against a particular project. The course grades the completeness of the record, never the vote.',
  howItRuns: list([
    'Live in our virtual classroom; works in Chrome, Edge or Safari on a laptop or desktop.',
    'National in scope: no state-specific rules, but the questions to ask your own utility, regulators and attorney.',
    'Every figure is sourced, shows who paid for it, and carries an as-of date; numbers are refreshed before each cohort.',
    'Not recorded. Captions on.',
  ]),

  cosponsorName: 'Center for Responsible Infrastructure',
  cosponsorUrl: 'https://crifuture.info/',
  independenceHeadline: 'Independent and nonpartisan',
  independenceNote:
    'No developer, utility or advocacy group on either side funds or shapes this course. Benefits and concerns get equal time, every industry-funded figure is paired with an independent one, and the instructor never says whether a community should host a data center.',

  faq: [
    {
      question: 'Does the course take a side?',
      answer:
        'No. It presents benefits and concerns with the same care, cites sources on both sides, and never recommends approving or denying a proposal. Officials critical of projects come from both parties, for different reasons.',
    },
    {
      question: 'How much does it cost?',
      answer:
        '$249 per seat; $199 for founding cohorts. Your fee is credited toward any Academy course within six months; if your organization paid, the credit goes to your organization.',
    },
    {
      question: 'Can my organization pay by invoice or purchase order?',
      answer: 'Yes. Tell us when you register and we’ll send an invoice to the contact you name.',
    },
    {
      question: 'Does it cover my state’s rules?',
      answer: 'It’s national. Instead of teaching one state’s rules, it shows you which questions to ask your own utility, regulators and attorney, and you map who decides what in your jurisdiction.',
    },
    { question: 'Do I need a technical background?', answer: 'No. The course is built for decision-makers, not engineers.' },
    { question: 'Is the session recorded?', answer: 'No. Officials speak more freely without a recording.' },
    {
      question: 'Could this count as a public meeting?',
      answer:
        'If a majority of your body attends together, it might. Tell us when you register and we’ll coordinate with your clerk, or set up a dedicated session. This is not legal advice.',
    },
  ],

  finalHeadline: 'A data center proposal is coming.',
  finalAccent: 'Know what to ask.',
  seoTitle: 'TA-102 Data Centers for Public Officials | Transformidable Academy',
  seoDescription:
    'A two-hour, nonpartisan live course for councils, commissions, planning boards and legislatures: what data centers are, what they bring, what they cost, and ten questions to test any proposal.',
}

const TA102 = { ...TA102_PAGE, listed: false }
// The placeholder entry the first seed made, before the course was written.
const TA102_PLACEHOLDER_SLUG = 'ta-102'

// What upgradeCourses() fills in, by slug, on courses made before Ways to
// take it. Only empty fields are filled.
const UPGRADES: Record<string, Record<string, unknown>> = {
  [TA101.slug]: { offerings: TA101.offerings, privateFormat: TA101.privateFormat, privateTerms: TA101.privateTerms },
  [WORKSHOP.slug]: { offerings: ['private'], availability: 'scheduled' },
  [APPLIED.slug]: { ...APPLIED_PAGE, offerings: APPLIED.offerings, privateFormat: APPLIED.privateFormat, privateTerms: APPLIED.privateTerms },
  [TA102_PLACEHOLDER_SLUG]: { offerings: TA102.offerings, privateTerms: TA102.privateTerms },
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

/**
 * Rebuilds the half-day private workshop as TA-201 (open cohorts as well as
 * private), once: only while the entry has no course code. Its copy is
 * replaced outright, and it links back to TA-101 for newcomers.
 */
async function upgradeToTA201(payload: Payload): Promise<void> {
  const { docs } = await payload.find({ collection: 'courses', where: { slug: { equals: WORKSHOP.slug } }, limit: 1, depth: 0 })
  const c = docs[0] as Record<string, any> | undefined
  if (!c || c.code) return
  const { docs: ta101 } = await payload.find({ collection: 'courses', where: { slug: { equals: TA101.slug } }, limit: 1, depth: 0 })
  await payload.update({
    collection: 'courses',
    id: c.id,
    data: { ...WORKSHOP_PAGE, ...(ta101[0] && { nextCourse: ta101[0].id }) } as any,
  })
  console.log('[seed:academy] Rebuilt governing-ai-adoption as TA-201.')
}

/**
 * TA-101's agenda added up to 75 of its 90 minutes. Adds the closing
 * questions part, once (while the parts still total 75), and points its
 * "What comes after" answer at TA-201.
 */
async function fixTA101(payload: Payload): Promise<void> {
  const { docs } = await payload.find({ collection: 'courses', where: { slug: { equals: TA101.slug } }, limit: 1, depth: 0 })
  const c = docs[0] as Record<string, any> | undefined
  if (!c) return
  const data: Record<string, unknown> = {}
  const agenda = Array.isArray(c.agenda) ? c.agenda : []
  const total = agenda.reduce((n: number, p: any) => n + (Number(p.minutes) || 0), 0)
  if (total === 75) {
    data.agenda = [...agenda, TA101_QA]
    if (c.agendaHeadline === 'Ninety minutes, five parts') data.agendaHeadline = TA101.agendaHeadline
  }
  if (Array.isArray(c.faq) && c.faq.some((q: any) => q.answer === TA101_OLD_NEXT_ANSWER)) {
    data.faq = c.faq.map((q: any) => (q.answer === TA101_OLD_NEXT_ANSWER ? { ...q, answer: TA101_NEXT_ANSWER } : q))
  }
  if (!Object.keys(data).length) return
  await payload.update({ collection: 'courses', id: c.id, data: data as any })
  console.log('[seed:academy] Fixed TA-101’s agenda and next-course answer.')
}

/**
 * Writes TA-102's course page into the placeholder entry the first seed made
 * ("Data centers (working title)", at /academy/courses/ta-102), once: only
 * while it still has the placeholder slug and no headline. It stays unlisted.
 */
async function upgradeTA102(payload: Payload): Promise<void> {
  const { docs } = await payload.find({ collection: 'courses', where: { slug: { equals: TA102_PLACEHOLDER_SLUG } }, limit: 1, depth: 0 })
  const c = docs[0] as Record<string, any> | undefined
  if (!c || c.headline) return
  await payload.update({ collection: 'courses', id: c.id, data: TA102_PAGE as any })
  console.log('[seed:academy] Wrote TA-102 Know What You’re Siting.')
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
    const ta101 = await payload.create({ collection: 'courses', data: { ...TA101, nextCourse: workshop.id } as any })
    await payload.update({ collection: 'courses', id: workshop.id, data: { nextCourse: ta101.id } as any })
    console.log('[seed:academy] Courses created.')
  }
  await upgradeCourses(payload)
  await upgradeToTA201(payload)
  await fixTA101(payload)
  await upgradeTA102(payload)

  const page = (await payload.findGlobal({ slug: 'academy-page', depth: 0 })) as { heroHeadline?: string }
  if (!page?.heroHeadline) {
    await payload.updateGlobal({ slug: 'academy-page', data: ACADEMY_PAGE as any })
    console.log('[seed:academy] Academy Page filled.')
  }
}
