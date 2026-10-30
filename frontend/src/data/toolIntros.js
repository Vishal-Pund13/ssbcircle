// What a signed-out visitor (and Google) sees on the sign-in-only tools.
// Used by ToolIntro on the page and by scripts/prerender.mjs for the static
// HTML, so the two always say the same thing.

export const TOOL_INTROS = {
  piq: {
    path: '/piq',
    eyebrow: 'PIQ Analyzer',
    title: 'See what your Interviewing Officer is likely to ask',
    subtitle: 'The PIQ (Personal Information Questionnaire) is the form you fill on day one at the SSB. Your Interviewing Officer reads it before calling you in, and most questions come straight out of it. Fill it here and see those questions before the IO asks them.',
    steps: [
      { title: 'Fill your PIQ', text: 'The same sections as the real form: family, education, sports, hobbies, responsibilities and achievements.' },
      { title: 'Get your report', text: 'Questions tailored to what you wrote, the gaps an IO may notice, and how to prepare for each.' },
      { title: 'Use it as your blueprint', text: 'Download the report as a PDF, print it, and tick off each question as you prepare.' },
    ],
    points: [
      'Private: only you can see your PIQ, and you can delete it any time.',
      'AI analysis has a daily limit, so use it when your PIQ is ready.',
    ],
    faq: [
      { q: 'What is the PIQ form in SSB?',
        a: 'The Personal Information Questionnaire is a form every candidate fills at the start of the SSB. It asks about your family, education, sports, hobbies, responsibilities and achievements.' },
      { q: 'Why does the PIQ matter so much?',
        a: 'The Interviewing Officer reads your PIQ before the interview and builds most questions from it. If you know your own PIQ well, you walk into the interview prepared.' },
      { q: 'Is my PIQ data safe?',
        a: 'Your PIQ is never shown to other members and never appears on your profile. When you delete it, it is removed from our database, not just hidden.' },
    ],
    cta: 'Sign in to fill your PIQ',
  },
  tat: {
    path: '/tat',
    eyebrow: 'TAT Practice',
    title: 'Write a TAT story, see how it reads',
    subtitle: 'The TAT (Thematic Apperception Test) is one of the psychology tests at the SSB. You see a picture for 30 seconds, then write a story in 4 minutes. Practise the same way here and get feedback on your story.',
    steps: [
      { title: 'See the picture', text: '30 seconds to look, just like the real test.' },
      { title: 'Write your story', text: '4 minutes on the clock: what led to this, what the hero does, how it ends.' },
      { title: 'Get feedback', text: 'How your hero thinks and acts, how the story is built, and what to work on.' },
    ],
    points: [
      'Write your own thoughts. A simple honest idea beats a memorised theme.',
      'AI analysis has a daily limit, so use it when you are ready to write.',
    ],
    faq: [
      { q: 'What is TAT in SSB?',
        a: 'TAT stands for Thematic Apperception Test. It is part of the psychology tests on the second day of the SSB. You are shown 12 pictures, one of them blank, and write a story on each.' },
      { q: 'How much time do I get for each TAT story?',
        a: 'You see each picture for 30 seconds and then get 4 minutes to write the story.' },
      { q: 'How should I write a TAT story?',
        a: 'Let the story come from the picture. Keep your hero real and solve the problem with practical steps. Think in three parts: what led to this, what the hero does, and how it ends.' },
    ],
    cta: 'Sign in to start writing',
  },
};
