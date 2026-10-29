// Officer entries into the armed forces and who can apply, for the "Am I
// eligible?" checker on /exams.
//
// UPDATE THIS FILE EACH CYCLE, alongside examCalendar.js. Age is checked as an
// age band on a reference date (usually the course start), which is how the
// notifications state it. NDA uses the exact birth window instead, shifted one
// year from the last notification. All of it is guidance: the official
// notification is final, and the checker says so.
//
// edu levels: 0 Class 10/11 · 1 Class 12 appearing · 2 Class 12 passed
//             3 Graduation final year · 4 Graduate · 5 Post-graduate
// degrees:    'engg' (BE/BTech) · 'comp' (BCA/MCA/B.Sc or M.Sc CS/IT)
//             'law' (LLB) · 'other' (BA, B.Com, B.Sc, etc.)

export const EDU_LEVELS = [
  { value: 0, label: 'Class 10 or 11' },
  { value: 1, label: 'Class 12 (appearing)' },
  { value: 2, label: 'Class 12 (passed)' },
  { value: 3, label: 'Graduation (final year)' },
  { value: 4, label: 'Graduate' },
  { value: 5, label: 'Post-graduate' },
];

export const DEGREES = [
  { value: 'engg',  label: 'B.E. / B.Tech' },
  { value: 'comp',  label: 'Computers (BCA, MCA, B.Sc/M.Sc CS or IT)' },
  { value: 'law',   label: 'Law (LLB)' },
  { value: 'other', label: 'Other (BA, B.Com, B.Sc, etc.)' },
];

export const ENTRIES = [
  // ── After Class 12 ────────────────────────────────────────────────────────
  {
    id: 'nda1', name: 'NDA (I) 2027', service: 'Army · Navy · Air Force', calendarId: 'nda1-2027',
    born: ['2008-07-02', '2011-07-01'], gender: 'all', minEdu: 1,
    needsPcmFor: 'Navy and Air Force wings',
    notes: 'Written exam by UPSC, then SSB. Unmarried candidates only.',
  },
  {
    id: 'nda2', name: 'NDA (II) 2027', service: 'Army · Navy · Air Force', calendarId: 'nda2-2027',
    born: ['2009-01-02', '2012-01-01'], gender: 'all', minEdu: 1,
    needsPcmFor: 'Navy and Air Force wings',
    notes: 'Written exam by UPSC, then SSB. Unmarried candidates only.',
  },
  {
    id: 'tes', name: 'Army 10+2 TES', service: 'Army, technical', calendarId: 'tes57',
    ref: '2027-07-01', age: [16.5, 19.5], gender: 'male', minEdu: 2, pcm: true,
    notes: 'No written exam: shortlist on 12th PCM marks (60%+) and JEE Mains, then SSB.',
  },
  {
    id: 'navy-btech', name: 'Navy 10+2 B.Tech Cadet Entry', service: 'Navy, executive & technical', calendarId: 'navy-btech-2027',
    ref: '2027-07-01', age: [17, 19.5], gender: 'all', minEdu: 2, pcm: true,
    notes: 'No written exam: shortlist on JEE Mains rank, needs 70% in PCM and 50% in English, then SSB.',
  },

  // ── After graduation ──────────────────────────────────────────────────────
  {
    id: 'cds-ima', name: 'CDS (I) 2027 — IMA', service: 'Army, Permanent Commission', calendarId: 'cds1-2027',
    ref: '2028-01-01', age: [19, 24], gender: 'male', minEdu: 3,
    notes: 'Any degree. Written exam by UPSC, then SSB. Unmarried men.',
  },
  {
    id: 'cds-ina', name: 'CDS (I) 2027 — INA', service: 'Navy, Permanent Commission', calendarId: 'cds1-2027',
    ref: '2028-01-01', age: [19, 22], gender: 'male', minEdu: 3, degrees: ['engg'],
    notes: 'B.E./B.Tech only. Written exam by UPSC, then SSB.',
  },
  {
    id: 'cds-afa', name: 'CDS (I) 2027 — AFA', service: 'Air Force, flying', calendarId: 'cds1-2027',
    ref: '2028-01-01', age: [20, 24], gender: 'all', minEdu: 3, pcm: true,
    notes: 'Degree with Physics and Maths in 12th, or B.E. Written exam, then SSB and pilot aptitude test (CPSS).',
  },
  {
    id: 'cds-ota', name: 'CDS (I) 2027 — OTA', service: 'Army, Short Service', calendarId: 'cds1-2027',
    // Age is reckoned on 1 Jan of the course year, though OTA starts in April
    ref: '2028-01-01', age: [19, 25], gender: 'all', minEdu: 3,
    notes: 'Any degree. Separate OTA paper (English and GK only), then SSB.',
  },
  {
    id: 'afcat-fly', name: 'AFCAT — Flying', service: 'Air Force, pilot', calendarId: 'afcat1-2027',
    ref: '2028-01-01', age: [20, 24], gender: 'all', minEdu: 3, pcm: true,
    notes: 'Degree with 60%, and Physics and Maths in 12th (50% each). Online exam, then SSB and CPSS.',
  },
  {
    id: 'afcat-tech', name: 'AFCAT — Ground Duty (Technical)', service: 'Air Force, aeronautical engineering', calendarId: 'afcat1-2027',
    ref: '2028-01-01', age: [20, 26], gender: 'all', minEdu: 3, degrees: ['engg'], pcm: true,
    notes: 'B.E./B.Tech in notified branches. Online exam (plus EKT), then SSB.',
  },
  {
    id: 'afcat-nontech', name: 'AFCAT — Ground Duty (Non-Technical)', service: 'Air Force, admin, logistics, accounts, education', calendarId: 'afcat1-2027',
    ref: '2028-01-01', age: [20, 26], gender: 'all', minEdu: 3,
    notes: 'Any degree with 60% (branch rules vary). Online exam, then SSB.',
  },
  {
    id: 'tgc', name: 'Army TGC-146', service: 'Army, technical, Permanent Commission', calendarId: 'tgc146',
    ref: '2028-01-01', age: [20, 27], gender: 'male', minEdu: 3, degrees: ['engg'],
    notes: 'No written exam: shortlist on engineering marks, then SSB. Unmarried men.',
  },
  {
    id: 'ssc-tech', name: 'Army SSC (Tech) 69', service: 'Army, technical, Short Service', calendarId: 'ssctech69',
    ref: '2027-10-01', age: [20, 27], gender: 'all', minEdu: 3, degrees: ['engg'],
    notes: 'No written exam: shortlist on engineering marks, then SSB.',
  },
  {
    id: 'ncc', name: 'Army NCC Special Entry', service: 'Army, Short Service', calendarId: null,
    ref: '2027-10-01', age: [19, 25], gender: 'all', minEdu: 3, ncc: true,
    notes: "Any degree with 50%, plus NCC 'C' certificate with at least 'B' grade. No written exam.",
  },
  {
    id: 'jag', name: 'Army JAG Entry', service: 'Army, legal branch', calendarId: null,
    ref: '2027-10-01', age: [21, 27], gender: 'all', minEdu: 4, degrees: ['law'],
    notes: 'LLB with 55% and Bar Council registration eligibility. No written exam.',
  },
  {
    id: 'navy-ssc-exec', name: 'Navy SSC Executive & Technical', service: 'Navy, Short Service', calendarId: 'navy-ssc-exec',
    ref: '2028-01-01', age: [19.5, 24], gender: 'all', minEdu: 3, degrees: ['engg'],
    notes: 'Mostly B.E./B.Tech with 60%; some branches accept other degrees. Shortlist on marks, then SSB.',
  },
  {
    id: 'navy-ssc-it', name: 'Navy SSC Executive (IT)', service: 'Navy, IT branch', calendarId: 'navy-ssc-it',
    ref: '2027-07-01', age: [19, 25], gender: 'all', minEdu: 3, degrees: ['engg', 'comp'],
    notes: 'Computer-related degree with 60%, and 60% English in 10th or 12th. Shortlist on marks, then SSB.',
  },
];
