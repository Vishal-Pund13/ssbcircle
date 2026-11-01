// "How SSBCircle works" — every tool, and what to use first depending on
// where an aspirant is. Used by the /how-it-works page and by
// scripts/prerender.mjs for the static HTML, so the two always match.
// Icons are lucide names, resolved in the page.

import { MENTORS } from './mentors.js';

const mentor = MENTORS.find(m => m.isActive && m.whatsapp);

export const TOOLS = {
  guide: {
    icon: 'Compass', name: 'Become an officer guide', to: '/become-an-officer',
    what: 'Every officer role in the Army, Navy and Air Force, how to join after 12th or after graduation, and how selection works.',
    when: 'First, if you are new to all this.', time: '15 min read',
  },
  exams: {
    icon: 'CalendarDays', name: 'Exam calendar & eligibility', to: '/exams',
    what: 'Check which entries you can apply for, and see every notification, exam and result date.',
    when: 'Before you pick an entry, and once a month after that.', time: '5 min',
  },
  piq: {
    icon: 'FileText', name: 'PIQ Analyzer', to: '/piq', signIn: true,
    what: 'Fill your PIQ form and get the questions your Interviewing Officer is likely to ask, as a report you can print.',
    when: 'As soon as you expect an SSB call. Your interview is built on your PIQ.', time: '30 min, once',
  },
  prep: {
    icon: 'ListChecks', name: 'SSB Prep Sheet', to: '/prep',
    what: '101 must-know topics for the interview and GD, with a daily plan, a streak and spoken-answer practice.',
    when: 'Every day. A little each day beats cramming.', time: '15–20 min a day',
  },
  tat: {
    icon: 'PenLine', name: 'TAT Practice', to: '/tat', signIn: true,
    what: 'See a picture for 30 seconds, write a story in 4 minutes, and get feedback on how it reads.',
    when: 'A few stories a week in the run-up to your SSB.', time: '5 min a story',
  },
  news: {
    icon: 'BookOpen', name: 'News Cards', to: '/current-affairs',
    what: 'Explainers on defence, world affairs, the economy and more — with maps, visuals, mind maps and quizzes.',
    when: 'One card a day, for your GD, lecturette and interview.', time: '8 min a card',
  },
  rooms: {
    icon: 'Radio', name: 'Live Rooms', to: '/?tab=live', signIn: true,
    what: 'Practise GD, PPDT, lecturette and mock interviews by voice with other aspirants.',
    when: 'Once or twice a week, to build speaking confidence.', time: '30–45 min',
  },
  community: {
    icon: 'Users', name: 'Community', to: '/community',
    what: 'Share your SSB experience, find batchmates for your dates, and ask doubts.',
    when: 'Whenever you are stuck, and after your SSB to help others.', time: 'Any time',
  },
  ...(mentor && {
    mentor: {
      icon: 'MessageCircle', name: 'Talk to an officer', to: `/mentor/${mentor.slug}`, mentor: true,
      what: `Message ${mentor.name}, a verified ex-officer, on WhatsApp for personal guidance on your PIQ, interview and mindset.`,
      when: 'When you want an honest human view of where you stand.', time: 'Starts with a 1-minute form',
    },
  }),
};

// Where an aspirant is, and the tools to use in that order
export const STAGES = [
  { id: 'starting', label: "I'm just starting", sub: 'I want to know how to become an officer', icon: 'Compass',
    steps: ['guide', 'exams', 'news'] },
  { id: 'written', label: 'My written exam is coming', sub: 'NDA, CDS, AFCAT or another entry', icon: 'BookOpen',
    steps: ['exams', 'news', 'prep', 'community'] },
  { id: 'ssb', label: 'My SSB is coming up', sub: 'I have, or expect, an SSB call', icon: 'Target',
    steps: ['piq', 'prep', 'tat', 'rooms', 'mentor'] },
  { id: 'guidance', label: "I want an officer's guidance", sub: 'Talk to someone who has been through it', icon: 'MessageCircle',
    steps: ['mentor', 'piq', 'community'] },
].map(s => ({ ...s, steps: s.steps.filter(id => TOOLS[id]) }));

// A routine that fits into 20 minutes, plus the weekly extras
export const DAILY = [
  { tool: 'prep', text: "Read today's topic on the Prep Sheet", time: '10 min' },
  { tool: 'prep', text: 'Say your answer out loud and get it analysed', time: '3 min' },
  { tool: 'news', text: 'Read one News Card and take its quiz', time: '8 min' },
];
export const WEEKLY = [
  { tool: 'rooms', text: 'Join one Live Room — GD or mock interview' },
  { tool: 'tat', text: 'Write two TAT stories' },
  { tool: 'community', text: 'Answer one doubt in the Community' },
];
