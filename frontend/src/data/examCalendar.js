// Defence officer entry exams and results, for the home page and /exams.
//
// UPDATE THIS FILE EACH CYCLE. Dates marked confirmed come from the UPSC
// annual calendar (published 20 May 2026) or a released notification.
// Everything else is "expected": the usual month for that entry, shown as a
// month only so it never looks more certain than it is. When an official
// notification comes out, add the exact date and set confirmed: true.
//
// date:  'YYYY-MM-DD' for an exact day, 'YYYY-MM' for an expected month.
// kind:  'notification' | 'apply' | 'exam' | 'result' | 'ssb'

export const CALENDAR_CHECKED = '2026-10-30';

export const EXAMS = [
  {
    id: 'nda1-2027', name: 'NDA & NA (I) 2027', body: 'UPSC', service: 'Army · Navy · Air Force',
    who: 'After 12th (age 16½–19½)', link: 'https://upsc.gov.in',
    events: [
      { kind: 'notification', label: 'Notification',     date: '2026-12-02', confirmed: true },
      { kind: 'apply',        label: 'Last date to apply', date: '2026-12-22', confirmed: true },
      { kind: 'exam',         label: 'Written exam',      date: '2027-04-11', confirmed: true },
      { kind: 'result',       label: 'Written result',    date: '2027-05' },
    ],
  },
  {
    id: 'cds1-2027', name: 'CDS (I) 2027', body: 'UPSC', service: 'IMA · INA · AFA · OTA',
    who: 'Graduates', link: 'https://upsc.gov.in',
    events: [
      { kind: 'notification', label: 'Notification',     date: '2026-12-02', confirmed: true },
      { kind: 'apply',        label: 'Last date to apply', date: '2026-12-22', confirmed: true },
      { kind: 'exam',         label: 'Written exam',      date: '2027-04-11', confirmed: true },
      { kind: 'result',       label: 'Written result',    date: '2027-05' },
    ],
  },
  {
    id: 'afcat1-2027', name: 'AFCAT (01/2027)', body: 'Indian Air Force', service: 'Flying · Ground Duty',
    who: 'Graduates (age 20–24 flying, 20–26 ground)', link: 'https://afcat.cdac.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2026-11' },
      { kind: 'exam',         label: 'Online exam',  date: '2027-02' },
    ],
  },
  {
    id: 'nda2-2027', name: 'NDA & NA (II) 2027', body: 'UPSC', service: 'Army · Navy · Air Force',
    who: 'After 12th', link: 'https://upsc.gov.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2027-05' },
      { kind: 'exam',         label: 'Written exam', date: '2027-09-19', confirmed: true },
    ],
  },
  {
    id: 'cds2-2027', name: 'CDS (II) 2027', body: 'UPSC', service: 'IMA · INA · AFA · OTA',
    who: 'Graduates', link: 'https://upsc.gov.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2027-05' },
      { kind: 'exam',         label: 'Written exam', date: '2027-09' },
    ],
  },
  {
    id: 'afcat2-2027', name: 'AFCAT (02/2027)', body: 'Indian Air Force', service: 'Flying · Ground Duty',
    who: 'Graduates', link: 'https://afcat.cdac.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2027-06' },
      { kind: 'exam',         label: 'Online exam',  date: '2027-08' },
    ],
  },
  {
    id: 'tes57', name: 'Army 10+2 TES-57', body: 'Indian Army', service: 'Technical Entry (no written exam)',
    who: '12th PCM 60% + JEE Mains', link: 'https://joinindianarmy.nic.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2026-11' },
    ],
  },
  {
    id: 'ssctech69', name: 'Army SSC (Tech) 69', body: 'Indian Army', service: 'Short Service, engineers (no written exam)',
    who: 'Engineering graduates', link: 'https://joinindianarmy.nic.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2027-01' },
    ],
  },
  {
    id: 'tgc145', name: 'Army TGC-145', body: 'Indian Army', service: 'Technical Graduate Course, Permanent Commission (no written exam)',
    who: 'Engineering graduates, unmarried men (age 20–27)', link: 'https://joinindianarmy.nic.in',
    events: [
      { kind: 'apply', label: 'Applications closed', date: '2026-10-29', confirmed: true },
      { kind: 'ssb',   label: 'SSB interviews',      date: '2027-01' },
    ],
  },
  {
    id: 'tgc146', name: 'Army TGC-146', body: 'Indian Army', service: 'Technical Graduate Course, Permanent Commission (no written exam)',
    who: 'Engineering graduates, unmarried men (age 20–27)', link: 'https://joinindianarmy.nic.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2027-04' },
    ],
  },
  {
    id: 'navy-ssc-it', name: 'Navy SSC Executive (IT)', body: 'Indian Navy', service: 'Short Service, IT branch (no written exam)',
    who: 'BE/BTech, BCA/MCA, B.Sc/M.Sc in computer fields, 60% (age 19–25)', link: 'https://www.joinindiannavy.gov.in',
    events: [
      { kind: 'notification', label: 'Notification for next course', date: '2026-12' },
    ],
  },
  {
    id: 'navy-ssc-exec', name: 'Navy SSC Executive & Technical', body: 'Indian Navy', service: 'General Service, Pilot, Observer, ATC, Logistics, Engineering (no written exam)',
    who: 'Graduates in the branch subjects, mostly BE/BTech 60% (age about 19½–24)', link: 'https://www.joinindiannavy.gov.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2027-02' },
    ],
  },
  {
    id: 'navy-btech-2027', name: 'Navy 10+2 B.Tech Entry', body: 'Indian Navy', service: 'Cadet Entry (no written exam)',
    who: '12th PCM 70% + JEE Mains', link: 'https://www.joinindiannavy.gov.in',
    events: [
      { kind: 'notification', label: 'Notification', date: '2026-12' },
    ],
  },
];

// Recent written results: who is heading to SSB now
export const RESULTS = [
  { name: 'CDS (II) 2026 written result', date: '2026-10-19', note: '8,956 candidates qualified for SSB', link: 'https://upsc.gov.in' },
  { name: 'NDA & NA (II) 2026 written result', date: '2026-10-09', note: 'Shortlisted candidates now get SSB call-ups', link: 'https://upsc.gov.in' },
  { name: 'SSC (Tech) 68 & TES-56', date: '2026-10', note: 'Applications closed; SSB interviews under way', link: 'https://joinindianarmy.nic.in' },
];
