// Content for the Moderator Programme page (/moderators).
//
// The score table here must match backend/src/models/Moderation.js (WEIGHTS,
// CAPS, TARGETS). If you change one, change the other.

export const PERKS = [
  { icon: 'IndianRupee', title: 'Monthly stipend', text: 'Moderators are paid a stipend every month for their time and work.' },
  { icon: 'BadgeCheck', title: 'MOD badge', text: 'A moderator badge next to your name across the community.' },
  { icon: 'Users', title: 'Work with the founding officers', text: 'Direct access to the officers who built SSBCircle — guidance for your own SSB too.' },
  { icon: 'Award', title: 'Certificate and reference', text: 'A certificate of service, and a reference that shows leadership and responsibility.' },
];

export const DUTIES = [
  'Host practice sessions regularly — GD, PPDT, lecturette or mock interviews.',
  'Welcome new members and help them find their way.',
  'Answer doubts in the community and keep discussions useful.',
  'Report users who misbehave, spam or break the rules.',
  'Tell us about bugs, problems and ideas to improve the platform.',
  'Set an example: respectful, honest and helpful.',
];

export const WHO_CAN_APPLY = [
  'Any SSBCircle member with an account in good standing.',
  'You enjoy helping others prepare, and can give a few hours a week.',
  'You are respectful, honest and follow the community rules.',
  'You do not need to be recommended at the SSB already. Many great moderators are still preparing.',
];

export const STEPS = [
  { title: 'Opt in', text: 'Tell us why you want to help and when you are free. It takes two minutes.' },
  { title: '2-week trial', text: 'For 14 days, just be active. Host sessions, help people, report problems. We track it automatically.' },
  { title: 'Officer review', text: 'The founding officers look at your activity and how you treat others. We may call you for a short chat.' },
  { title: 'Become a moderator', text: 'If it is a good fit, you get the MOD badge, the stipend and a seat on the team.' },
];

// Mirrors WEIGHTS / CAPS / TARGETS on the backend
export const SCORE_ROWS = [
  { key: 'hosted',      label: 'Hosting a practice session or room', points: '10 each' },
  { key: 'posts',       label: 'A community post (experience, SSB date, doubt…)', points: '5 each' },
  { key: 'replies',     label: 'A helpful reply on someone else\'s post', points: '2 each' },
  { key: 'upvotes',     label: 'Upvotes others give your posts', points: '1 each' },
  { key: 'reports',     label: 'Reporting a user who breaks the rules', points: '5 each (up to 5)' },
  { key: 'feedback',    label: 'Reporting a problem or idea for the platform', points: '3 each (up to 5)' },
  { key: 'im_in',       label: 'Saying "I\'m in" to someone\'s session', points: '2 each' },
  { key: 'active_days', label: 'Each day you are active', points: '1 a day' },
];

export const TARGET_ROWS = [
  { key: 'hosted',      label: 'Sessions hosted' },
  { key: 'replies',     label: 'Helpful replies' },
  { key: 'active_days', label: 'Active days' },
  { key: 'score',       label: 'Activity score' },
];

export const FAQ = [
  { q: 'Do I need to be recommended at the SSB to apply?', a: 'No. What matters is that you help others regularly and behave well. Many moderators are still preparing for their own SSB.' },
  { q: 'How much time does it take?', a: 'A few hours a week is enough: one or two sessions, and checking the community most days.' },
  { q: 'What if I did not opt in?', a: 'We look at everyone\'s activity, not only applicants. If you are already helping the community the way a moderator would, the founding officers may contact you directly.' },
  { q: 'What if my trial does not go well?', a: 'Nothing is lost. You can keep practising and opt in again later.' },
  { q: 'Can a moderator be removed?', a: 'Yes. Moderators who stop being active, or who misuse their role, can be removed by the founding officers.' },
  { q: 'Is the score the only thing that counts?', a: 'No. The score helps us notice people, but the final decision also looks at how you treat others and the quality of your help.' },
];
