// The sections News Cards are grouped into, in the order the page shows them.
// The ids are the article `category` values stored in the database; the admin
// article form and the home page use the same list, so a new section is added
// here once. backend/src/routes/admin.js keeps a matching list of valid ids.

export const NEWS_SECTIONS = [
  { id: 'ssb-tips',       label: 'SSB Tips',                 blurb: 'Interview answers, preparation methods and resources' },
  { id: 'defence',        label: 'Defence & Security',       blurb: 'Forces, borders, operations and defence news' },
  { id: 'international',  label: 'International Relations', blurb: 'India and the world — neighbours, powers and groupings' },
  { id: 'economic',       label: 'Economy',                  blurb: 'Growth, jobs, money and trade' },
  { id: 'polity',         label: 'Polity & Governance',      blurb: 'Constitution, elections and how India is run' },
  { id: 'socio-cultural', label: 'Society',                  blurb: 'People, population, women, youth and social issues' },
  { id: 'science',        label: 'Science & Tech',           blurb: 'Space, AI and technology' },
  { id: 'geographic',     label: 'Environment & Geography', blurb: 'Climate, disasters, rivers and resources' },
];

export const sectionLabel = id => NEWS_SECTIONS.find(s => s.id === id)?.label || id;
