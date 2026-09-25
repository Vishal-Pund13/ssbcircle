// The exams an aspirant can be preparing for, and where they heard about us.
//
// Three places rely on these lists: the welcome screen, the profile editor, and
// the validation in backend/src/routes/auth.js. The backend copy is the one
// that actually rejects bad input, so if you add an option here, add it there
// too or the save will fail.
export const EXAM_TYPES = [
  'NDA',
  'CDS',
  'AFCAT',
  'SSC Tech (Army)',
  'TGC (Army)',
  'Navy (Tech)',
  'Navy (Non-Tech)',
  'Other',
];

export const SOURCES = [
  'Instagram',
  'YouTube',
  'WhatsApp group',
  'Telegram',
  'A friend or coursemate',
  'Google search',
  'Coaching academy',
  'Other',
];
