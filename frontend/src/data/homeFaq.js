// The home page FAQ — what SSBCircle is, in the questions people actually ask.
//
// One source for two places: the FAQ on the home page, and the FAQPage
// structured data in the home page's <head> (scripts/prerender.mjs writes it
// from this file at build time). Google expects the two to match, so edit
// here only. Answers are plain text; `steps` show only on the page.
//
// Simple words, short sentences — many readers are not native speakers.

export const HOME_FAQ = [
  {
    q: 'What is SSBCircle?',
    a: 'A platform for anyone who wants to become an officer in the Indian Army, Navy or Air Force. It covers the whole journey: what you can become and how to join, the exam dates, AI feedback on your PIQ, TAT stories and spoken answers, a Prep Sheet of topics for GD and interview, and live practice with other aspirants.',
  },
  {
    q: 'I am new to all this. Where do I start?',
    a: 'Start with the "How to become an officer" guide. Then check which entries you are eligible for, note the exam dates, and fill your PIQ — most interview questions come from it. After that, practise a little every day.',
    steps: ['Read how to become an officer', 'Check your eligibility', 'Note the exam dates', 'Fill your PIQ', 'Practise daily'],
  },
  {
    q: 'How does the PIQ Analyzer help me in the SSB interview?',
    a: 'Fill your Personal Information Questionnaire and our AI reads it the way an Interviewing Officer would, using the methods SSB mentors use. You get the questions you are likely to face, grouped the way an IO asks them, the points where you will be pressed, and a short practice plan. Download it as a PDF and keep it in front of you while you prepare.',
  },
  {
    q: 'How does TAT practice work?',
    a: 'You see a TAT-style picture, write a story in four minutes, and get feedback on how it reads to an assessor — the hero, the action, the outcome and what it shows about you. If you have filled your PIQ, you also get ideas drawn from your own life, which you are free to use or ignore.',
  },
  {
    q: 'What is the Prep Sheet?',
    a: 'Over 100 topics in nine sections — yourself, the armed forces, defence, international relations, economy, polity, society, science and environment — made with SSB ex-assessors and recommended candidates. You do not need to be an expert: know the basics of each and have your own view. Answer each question out loud and get AI feedback; add your SSB date for a daily plan and revision.',
  },
  {
    q: 'Which entries can I apply for, and when are the exams?',
    a: 'Enter your date of birth and education in the eligibility checker to see the officer entries open to you — NDA, CDS, AFCAT, TES, TGC, Navy entries and more. The exam calendar shows upcoming notifications, exam dates and results, and the ticker on the home page keeps you reminded.',
  },
  {
    q: 'Can I practise with other aspirants?',
    a: 'Yes. Join live voice rooms for Group Discussion, PPDT, Lecturette and mock interviews, or create your own and share the code. Aspirants meet every day at 10 PM and 11 PM IST. In the Community you can share your SSB experience, find others with the same SSB dates, and ask your doubts.',
  },
  {
    q: 'Why is AI feedback limited each day?',
    a: 'Every AI check — a PIQ report, TAT feedback or a spoken answer — costs us real money to run. That is why there is a daily limit. Please use it when your answer is ready, not just to test; using it responsibly keeps it available for everyone.',
  },
  {
    q: 'Is my PIQ private?',
    a: 'Yes. Only you can see your PIQ and your reports; they are never shown to other users. When you ask for a report, your answers are sent to our AI provider only to write that report.',
  },
];
