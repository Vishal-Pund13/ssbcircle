// Post-build step: give every crawlable route its own static HTML file.
//
// Why this exists: the app is a single-page app, so Vercel rewrites every URL
// to the same index.html — which carries one hardcoded
// <link rel="canonical" href="https://www.ssbcircle.com/">. Google therefore
// saw /current-affairs, /register, /article/* etc. as duplicates of the
// homepage and filed them under "Alternate page with proper canonical tag",
// i.e. crawled but deliberately not indexed.
//
// This script stamps out one dist/<route>/index.html per route with its own
// canonical, title, description and social tags, and writes sitemap.xml to
// match. Vercel serves a matching static file before it applies the SPA
// rewrite, so each URL now answers with its own head. The body is still
// rendered by React; only the head and the no-JS fallback are per-route.

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SWIPE_SLUGS }  from '../src/data/swipeArticles.js';
import { MENTORS }      from '../src/data/mentors.js';
import * as GUIDE       from '../src/data/beginnerGuide.js';
import { HOME_FAQ }     from '../src/data/homeFaq.js';
import { STEPS as PREP_STEPS, TOPICS as PREP_TOPICS, LEVELS as PREP_LEVELS } from '../src/data/prepSheet.js';
import { EXAMS, RESULTS } from '../src/data/examCalendar.js';
import { TOOL_INTROS }  from '../src/data/toolIntros.js';
import * as MODS        from '../src/data/moderatorProgram.js';
import { sectionLabel } from '../src/data/newsSections.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const DIST      = path.join(ROOT, 'dist');
const SITE      = 'https://www.ssbcircle.com';
const API       = process.env.VITE_API_URL || 'https://ssbcircle.onrender.com';

const today = new Date().toISOString().slice(0, 10);

// ── "How to become an officer" guide ───────────────────────────────────────
// Our main landing page for people who only have the dream so far. React draws
// the interactive page; crawlers that do not run JS get every role, entry and
// answer from the same data as plain HTML, plus the FAQ as structured data.
function guideNoscript() {
  const h2 = t => `<h2 style="font-size:1.35rem;margin:28px 0 8px;">${esc(t)}</h2>`;
  const h3 = t => `<h3 style="font-size:1.1rem;margin:18px 0 4px;">${esc(t)}</h3>`;
  const p  = t => `<p style="line-height:1.7;color:#333;margin:4px 0;">${esc(t)}</p>`;
  let out = '';
  for (const s of GUIDE.SERVICES) {
    out += h2(`${s.name}: branches and roles for officers`) + p(s.oneLine + ' ' + s.intro) + p(s.note);
    for (const g of s.groups) {
      out += h3(`${s.name} — ${g.title}`) + p(g.blurb);
      out += '<ul>' + g.roles.map(r => `<li style="margin:6px 0;line-height:1.6;"><strong>${esc(r.name)}</strong>: ${esc(r.what)} How to join: ${esc(r.join)}.</li>`).join('') + '</ul>';
    }
  }
  out += h2('How to become an officer after 12th');
  out += '<ul>' + GUIDE.ENTRIES.school.map(e => `<li><strong>${esc(e.name)}</strong> (${esc(e.who)}): ${esc(e.note)}</li>`).join('') + '</ul>';
  out += h2('How to become an officer after graduation');
  out += '<ul>' + GUIDE.ENTRIES.graduate.map(e => `<li><strong>${esc(e.name)}</strong> (${esc(e.who)}): ${esc(e.note)}</li>`).join('') + '</ul>';
  out += h2('The SSB interview, stage by stage');
  out += '<ol>' + GUIDE.SSB_DAYS.map(d => `<li><strong>${esc(d.day)} — ${esc(d.title)}</strong>: ${esc(d.what)}</li>`).join('') + '</ol>';
  out += h2('Medical exam, merit list and training');
  out += '<ol>' + GUIDE.AFTER_SSB.map(a => `<li><strong>${esc(a.title)}</strong>: ${esc(a.what)}</li>`).join('') + '</ol>';
  out += h2('Questions people ask');
  out += GUIDE.FAQ.map(f => h3(f.q) + p(f.a)).join('');
  return out;
}

const GUIDE_ROUTE = {
  path: '/become-an-officer',
  title: 'How to Become an Officer in the Indian Army, Navy & Air Force | SSBCircle',
  description: 'A simple guide for anyone who dreams of becoming an Indian Armed Forces officer: Army, Navy and Air Force branches explained, how to join after 12th (NDA, TES) or graduation (CDS, AFCAT, TGC), the SSB interview, medicals and training.',
  priority: '0.9', changefreq: 'monthly',
  heading: 'How to become an officer in the Indian Armed Forces',
  blurb: 'What you can become in the Indian Army, Indian Navy and Indian Air Force, how to join after 12th or after graduation, and how the SSB interview, medical exam, merit list and training work — in simple words.',
  // A getter: esc() is defined further down, after this table is built
  get noscriptExtra() { return guideNoscript(); },
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: GUIDE.FAQ.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'SSBCircle', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'How to become an officer', item: `${SITE}/become-an-officer` },
        ],
      },
    ],
  },
};

// ── Tool pages ────────────────────────────────────────────────────────────
// Each of these used to answer with the homepage's head, so Google treated
// them as copies of the homepage. They now get their own head and real body
// text built from the same data the page draws. Builders are getters for the
// same reason as the guide: esc() is defined further down.

const crumbs = (name, p) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'SSBCircle', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name, item: `${SITE}${p}` },
  ],
});
const faqLd = faq => ({
  '@type': 'FAQPage',
  mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});
const H2 = t => `<h2 style="font-size:1.35rem;margin:28px 0 8px;">${esc(t)}</h2>`;
const H3 = t => `<h3 style="font-size:1.1rem;margin:18px 0 4px;">${esc(t)}</h3>`;
const P  = t => `<p style="line-height:1.7;color:#333;margin:4px 0;">${esc(t)}</p>`;
const UL = items => '<ul>' + items.map(i => `<li style="margin:6px 0;line-height:1.6;">${i}</li>`).join('') + '</ul>';
const OL = steps => '<ol>' + steps.map(s => `<li style="margin:6px 0;line-height:1.6;"><strong>${esc(s.title)}</strong>: ${esc(s.text)}</li>`).join('') + '</ol>';

// Every topic on the sheet, by section, with the question it prepares you for
function prepNoscript() {
  let out = '';
  for (const step of PREP_STEPS) {
    out += H2(step.title) + P(step.blurb);
    for (const g of step.groups) {
      out += H3(`${step.title}: ${g.title}`);
      out += UL(g.topics.map(t =>
        `<strong>${esc(t.title)}</strong> (${esc(PREP_LEVELS[t.level]?.label || '')})${t.ask ? ` — likely question: “${esc(t.ask)}”` : ''}`));
    }
  }
  return out;
}

const fmtDate = d => {
  const [y, m, day] = d.split('-').map(Number);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-IN', { month: 'long', timeZone: 'UTC' });
  return day ? `${day} ${month} ${y}` : `${month} ${y} (expected)`;
};
function examsNoscript() {
  let out = H2('Officer entry exam dates');
  for (const e of EXAMS) {
    out += H3(`${e.name} — ${e.body}`) + P(`For: ${e.who}. Joins: ${e.service}.`);
    out += UL(e.events.map(ev => `${esc(ev.label)}: ${esc(fmtDate(ev.date))}`));
  }
  out += H2('Recent results');
  out += UL(RESULTS.map(r => `<strong>${esc(r.name)}</strong> (${esc(fmtDate(r.date))}): ${esc(r.note)}`));
  return out;
}

const toolNoscript = t => H2('How it works') + OL(t.steps) + UL(t.points.map(esc))
  + H2('Questions people ask') + t.faq.map(f => H3(f.q) + P(f.a)).join('');

const modsNoscript = () => H2('What moderators get') + UL(MODS.PERKS.map(p => `<strong>${esc(p.title)}</strong>: ${esc(p.text)}`))
  + H2('What moderators do') + UL(MODS.DUTIES.map(esc))
  + H2('Who can apply') + UL(MODS.WHO_CAN_APPLY.map(esc))
  + H2('How it works') + OL(MODS.STEPS)
  + H2('Questions people ask') + MODS.FAQ.map(f => H3(f.q) + P(f.a)).join('');

const TOOL_ROUTES = [
  {
    path: '/prep',
    title: `SSB Interview Prep Sheet — ${PREP_TOPICS.length} Must-Know Topics with Questions | SSBCircle`,
    description: `Every topic to know before your SSB interview and GD: ${PREP_TOPICS.length} topics in ${PREP_STEPS.length} sections, from your own PIQ to defence and current affairs, each with the likely question. Made with SSB ex-assessors and recommended candidates.`,
    priority: '0.9', changefreq: 'weekly',
    heading: 'SSB Prep Sheet',
    blurb: `${PREP_TOPICS.length} topics in ${PREP_STEPS.length} sections, in the order worth learning them — each with the points to know and the question an Interviewing Officer is likely to ask. Made with SSB ex-assessors and recommended candidates, and kept up to date with current trends.`,
    get noscriptExtra() { return prepNoscript(); },
    jsonLd: { '@context': 'https://schema.org', '@graph': [crumbs('SSB Prep Sheet', '/prep')] },
  },
  {
    path: '/piq',
    title: 'SSB PIQ Form Analyzer — See What Your IO Will Ask | SSBCircle',
    description: 'Fill your SSB PIQ (Personal Information Questionnaire) and see the interview questions your Interviewing Officer is likely to ask from it. Private, and downloadable as a PDF blueprint.',
    priority: '0.9', changefreq: 'monthly',
    heading: TOOL_INTROS.piq.title,
    blurb: TOOL_INTROS.piq.subtitle,
    get noscriptExtra() { return toolNoscript(TOOL_INTROS.piq); },
    jsonLd: { '@context': 'https://schema.org', '@graph': [crumbs('PIQ Analyzer', '/piq'), faqLd(TOOL_INTROS.piq.faq)] },
  },
  {
    path: '/tat',
    title: 'TAT Practice for SSB — Write Stories, Get Feedback Online | SSBCircle',
    description: 'Practise the SSB Thematic Apperception Test online: see a picture for 30 seconds, write your story in 4 minutes, and get feedback on your hero, your plot and the qualities your story shows.',
    priority: '0.9', changefreq: 'monthly',
    heading: TOOL_INTROS.tat.title,
    blurb: TOOL_INTROS.tat.subtitle,
    get noscriptExtra() { return toolNoscript(TOOL_INTROS.tat); },
    jsonLd: { '@context': 'https://schema.org', '@graph': [crumbs('TAT Practice', '/tat'), faqLd(TOOL_INTROS.tat.faq)] },
  },
  {
    path: '/exams',
    title: 'NDA, CDS, AFCAT Exam Dates 2027 & Eligibility Checker | SSBCircle',
    description: 'Upcoming defence officer exam dates for NDA, CDS, AFCAT and more: notification, last date, exam and result dates, plus a checker for which officer entries you are eligible for.',
    priority: '0.9', changefreq: 'weekly',
    heading: 'Exam dates and eligibility for officer entries',
    blurb: 'Find the officer entries you can apply for in the Indian Army, Navy and Air Force, and never miss a notification, exam or result.',
    get noscriptExtra() { return examsNoscript(); },
    jsonLd: { '@context': 'https://schema.org', '@graph': [crumbs('Exam calendar', '/exams')] },
  },
  {
    path: '/moderators',
    title: 'Become an SSBCircle Moderator — Lead the SSB Community | SSBCircle',
    description: 'Host practice sessions, help other defence aspirants and keep the community safe. SSBCircle moderators get a monthly stipend, a MOD badge and direct access to the founding officers.',
    priority: '0.5', changefreq: 'monthly',
    heading: 'Lead the community. Get recognised and paid for it.',
    blurb: 'Active members who host sessions, help others and keep SSBCircle safe can become moderators — with a monthly stipend, a MOD badge and direct access to the founding officers.',
    get noscriptExtra() { return modsNoscript(); },
    jsonLd: { '@context': 'https://schema.org', '@graph': [crumbs('Moderator Programme', '/moderators'), faqLd(MODS.FAQ)] },
  },
];

// ── Route table ────────────────────────────────────────────────────────────
// noindex routes still get a self-canonical (so they are never reported as a
// duplicate of the homepage) but are kept out of the sitemap — they are forms
// and app screens with nothing to rank.
const STATIC_ROUTES = [
  {
    path: '/',
    priority: '1.0', changefreq: 'daily',
    // The template is already written for the homepage — leave its head alone.
    keepTemplateHead: true,
  },
  GUIDE_ROUTE,
  ...TOOL_ROUTES,
  {
    path: '/current-affairs',
    title: 'SSB Current Affairs & GD Topics — Explained for Aspirants | SSBCircle',
    description: 'Bite-sized current affairs explainers written for SSB aspirants — defence, economy, polity, geography and society. Read a card, then walk into any GD or Lecturette ready to speak.',
    priority: '0.9', changefreq: 'daily',
    heading: 'SSB Current Affairs and GD Topics',
    blurb: 'Current affairs explainers written for Service Selection Board aspirants — each one built around the GD, Lecturette and interview angle rather than raw news.',
  },
  {
    path: '/series/women-india',
    title: 'Women in India — A 7-Part Series for SSB GD & Lecturette | SSBCircle',
    description: 'Workforce participation, the pay gap, the glass ceiling, proxy representation, safety, education and health — a seven-part series on women in India, written for SSB GD and Lecturette preparation.',
    priority: '0.8', changefreq: 'monthly',
    heading: 'Women in India — a seven-part series',
    blurb: 'Seven linked explainers on women in India: the workforce paradox, proxy representation, the glass ceiling, the pay gap, safety as an economic problem, the education gap and the health silence.',
  },
  {
    path: '/session',
    title: 'Upcoming Live SSB Practice Sessions | SSBCircle',
    description: 'Scheduled live SSB practice sessions — GD, PPDT, Lecturette and IO mock interviews with real defence aspirants. Join straight from your browser.',
    priority: '0.7', changefreq: 'daily',
    heading: 'Upcoming live SSB practice sessions',
    blurb: 'Scheduled GD, PPDT, Lecturette and IO mock interview sessions you can join with other NDA, CDS and AFCAT aspirants.',
  },
  {
    path: '/community',
    title: 'SSB Community — Ask Doubts & Find Practice Sessions | SSBCircle',
    description: 'Ask your SSB doubts and get answers from other defence aspirants. Announcements, upcoming live practice sessions, and discussion for NDA, CDS, AFCAT and TGC candidates.',
    priority: '0.8', changefreq: 'daily',
    heading: 'SSB community',
    blurb: 'Ask a doubt, read announcements, and find upcoming live practice sessions. Open to every NDA, CDS, AFCAT, TGC and Navy aspirant preparing for the Services Selection Board.',
  },
  {
    path: '/register',
    title: 'Create Your SSBCircle Account — Start SSB Practice | SSBCircle',
    description: 'Sign up with Google and start practising SSB Group Discussion, PPDT, Lecturette and IO mock interviews in live voice rooms with real defence aspirants.',
    priority: '0.7', changefreq: 'monthly',
    heading: 'Join SSBCircle',
    blurb: 'Create an account and start practising SSB GD, PPDT, Lecturette and IO mock interviews with real aspirants.',
  },
  { path: '/login',  title: 'Sign in | SSBCircle',            description: 'Sign in to SSBCircle to join live SSB practice rooms.',        noindex: true },
  { path: '/join',   title: 'Join a practice room | SSBCircle', description: 'Enter a room code to join a live SSB practice room.',       noindex: true },
  { path: '/create', title: 'Create a practice room | SSBCircle', description: 'Create a live SSB GD, PPDT, Lecturette or IO practice room.', noindex: true },
];

// ── Article list: live API, falling back to the last known-good snapshot ────
async function loadArticles() {
  try {
    const res = await fetch(`${API}/api/articles?limit=100`, {
      signal: AbortSignal.timeout(60_000),   // Render free tier cold-starts slowly
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { articles } = await res.json();
    const live = (articles || []).filter(a => a.slug);
    if (!live.length) throw new Error('API returned no slugs');
    console.log(`  articles: ${live.length} from ${API}`);
    return live;
  } catch (err) {
    const fallback = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'articles.fallback.json'), 'utf8')
    );
    console.warn(`  articles: API unreachable (${err.message}) — using ${fallback.length} cached entries`);
    return fallback;
  }
}

// ── Head rewriting ─────────────────────────────────────────────────────────
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
}

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return re.test(html) ? html.replace(re, `$1${esc(value)}$2`) : html;
}

function setCanonical(html, url) {
  return html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${esc(url)}" />`
  );
}

// The FAQ and WebApplication blocks describe the homepage. Repeating them on
// every URL is duplicate structured data, so strip them off inner pages.
function stripHomepageJsonLd(html) {
  return html.replace(
    /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    m => (/"@type":\s*"(FAQPage|WebApplication|WebSite)"/.test(m) ? '' : m)
  );
}

function addJsonLd(html, obj) {
  const tag = `    <script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n    </script>\n`;
  return html.replace('</head>', `${tag}  </head>`);
}

// Replace the homepage marketing copy in <noscript> with something true of
// this route, for crawlers that never run the JS.
function setNoscript(html, heading, blurb, extra = '') {
  return html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>
      <div style="max-width:900px;margin:0 auto;padding:24px;font-family:sans-serif;color:#111;">
        <h1 style="font-size:1.9rem;font-weight:800;margin-bottom:8px;">${esc(heading)}</h1>
        <p style="font-size:1.05rem;color:#444;line-height:1.7;">${esc(blurb)}</p>${extra}
        <p style="margin-top:24px;"><a href="${SITE}/">SSBCircle — SSB interview preparation with real aspirants</a></p>
      </div>
    </noscript>`
  );
}

function buildPage(template, route) {
  let html = template;
  const url = SITE + (route.path === '/' ? '/' : route.path);

  html = setCanonical(html, url);
  html = setMeta(html, 'property', 'og:url', url);

  if (route.title) {
    html = setTitle(html, route.title);
    html = setMeta(html, 'property', 'og:title',     route.title);
    html = setMeta(html, 'name',     'twitter:title', route.title);
  }
  if (route.description) {
    html = setMeta(html, 'name',     'description',         route.description);
    html = setMeta(html, 'property', 'og:description',      route.description);
    html = setMeta(html, 'name',     'twitter:description', route.description);
  }
  if (route.noindex) {
    html = setMeta(html, 'name', 'robots', 'noindex, follow');
  }
  if (route.path !== '/') {
    html = stripHomepageJsonLd(html);
    html = setMeta(html, 'property', 'og:type', route.jsonLd ? 'article' : 'website');
  }
  if (route.jsonLd)  html = addJsonLd(html, route.jsonLd);
  if (route.heading) html = setNoscript(html, route.heading, route.blurb, route.noscriptExtra || '');

  return html;
}

function writePage(routePath, html) {
  const dir = routePath === '/' ? DIST : path.join(DIST, routePath.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

// ── Sitemap ────────────────────────────────────────────────────────────────
function buildSitemap(entries) {
  const urls = entries.map(e => `
  <url>
    <loc>${SITE}${e.path === '/' ? '/' : e.path}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n\n</urlset>\n`;
}

// ── Main ───────────────────────────────────────────────────────────────────
const templatePath = path.join(DIST, 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('prerender: dist/index.html not found — run vite build first');
  process.exit(1);
}
let template = fs.readFileSync(templatePath, 'utf8');

// The home page's FAQPage structured data comes from the same file as the FAQ
// on the page (src/data/homeFaq.js), so the two can never drift apart. It is
// written into the template before anything else; inner pages strip it again.
function homeFaqJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }, null, 2);
}
const FAQ_BLOCK = /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>/;
if (!FAQ_BLOCK.test(template)) {
  console.error('prerender: home FAQPage block not found in index.html');
  process.exit(1);
}
template = template.replace(FAQ_BLOCK, `<script type="application/ld+json">\n${homeFaqJsonLd()}\n    </script>`);
fs.writeFileSync(templatePath, template);

console.log('prerender: generating per-route HTML');
const articles = await loadArticles();
const sitemap  = [];

for (const route of STATIC_ROUTES) {
  if (!route.keepTemplateHead) writePage(route.path, buildPage(template, route));
  if (!route.noindex) {
    sitemap.push({ path: route.path, lastmod: today, changefreq: route.changefreq, priority: route.priority });
  }
}

// The list API carries no body, so each article's full text is fetched for the
// static HTML. A few at a time: the API runs on a small instance.
async function loadBodies(list) {
  const bodies = new Map();
  for (let i = 0; i < list.length; i += 4) {
    await Promise.all(list.slice(i, i + 4).map(async a => {
      try {
        const res = await fetch(`${API}/api/articles/${a.slug}`, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) return;
        const data = await res.json();
        const body = (data.article || data).content;
        if (body) bodies.set(a.slug, body);
      } catch { /* the summary stands in */ }
    }));
  }
  console.log(`  article bodies: ${bodies.size} of ${list.length}`);
  return bodies;
}

// The article markup (## headings, **bold**, lists and our [BLOCK] markers)
// as plain HTML for crawlers that read the page before any script runs.
function articleHtml(md) {
  const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  const lines = md.split('\n');
  let out = '', list = null;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { close(); continue; }
    let m;
    if ((m = line.match(/^\[COMPARE:([^|]+)\|(.+)\]$/))) {
      close();
      let rows = '';
      while (++i < lines.length && !lines[i].includes('[/COMPARE]')) {
        const [l, r] = lines[i].split('|');
        if (l?.trim()) rows += `<tr><td>${inline(l.trim())}</td><td>${inline((r || '').trim())}</td></tr>`;
      }
      out += `<table><tr><th>${esc(m[1])}</th><th>${esc(m[2])}</th></tr>${rows}</table>`;
      continue;
    }
    if (line.startsWith('[KEY-TERMS]')) {
      close();
      let rows = '';
      while (++i < lines.length && !lines[i].includes('[/KEY-TERMS]')) {
        const [t, d] = lines[i].split('|');
        if (t?.trim()) rows += `<dt>${esc(t.trim())}</dt><dd>${inline((d || '').trim())}</dd>`;
      }
      out += `<h2>Key terms</h2><dl>${rows}</dl>`;
      continue;
    }
    // Visuals, quizzes and mind maps are pictures and widgets on the page;
    // here they become a table, questions with answers, and a nested list.
    if ((m = line.match(/^\[VISUAL:[a-z]+(?:\|([^|\]]*))?.*\]$/))) {
      close();
      let rows = '';
      while (++i < lines.length && lines[i].trim() !== '[/VISUAL]') {
        const cells = lines[i].split('|').map(c => c.trim()).filter(c => c && c !== '*');
        if (cells.length) rows += `<tr>${cells.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`;
      }
      // Schematic maps carry no rows; their title is enough
      out += `${m[1] ? `<h3>${esc(m[1])}</h3>` : ''}${rows ? `<table>${rows}</table>` : ''}`;
      continue;
    }
    if (line === '[QUIZ]') {
      close();
      out += '<h2>Test yourself</h2>';
      while (++i < lines.length && lines[i].trim() !== '[/QUIZ]') {
        const [q, right, ...rest] = lines[i].split('|').map(c => c.trim());
        if (!q) continue;
        const why = rest.length > 2 ? rest[rest.length - 1] : '';
        out += `<h3>${esc(q)}</h3><p>Answer: ${esc(right)}.${why ? ` ${esc(why)}` : ''}</p>`;
      }
      continue;
    }
    if (line === '[MINDMAP]') {
      close();
      const items = [];
      while (++i < lines.length && lines[i].trim() !== '[/MINDMAP]') {
        const mm = lines[i].match(/^\s*-\s+(.+)$/);
        if (mm) items.push(`<li>${inline(mm[1])}</li>`);
      }
      out += `<h2>Mind map</h2><ul>${items.join('')}</ul>`;
      continue;
    }
    if ((m = line.match(/^\[CTA:([^|]+)\|(.+)\]$/))) { close(); out += `<p><a href="${esc(m[2])}">${esc(m[1])}</a></p>`; continue; }
    if ((m = line.match(/^\[IMAGE:([^|\]]+)(?:\|(.*))?\]$/))) {
      close();
      const src = m[1].startsWith('http') ? m[1] : SITE + m[1];
      out += `<figure><img src="${esc(src)}" alt="${esc(m[2] || '')}" loading="lazy"><figcaption>${esc(m[2] || '')}</figcaption></figure>`;
      continue;
    }
    if (/^\[(INFOGRAPHIC|DETAILS)[^\]]*\]$|^\[\/DETAILS\]$/.test(line)) continue;
    // Block markers that wrap ordinary text: keep the text
    const text = line.replace(/\[\/?(CALLOUT|SSB-GD|SSB-PI|SSB-LECTURETTE|QUOTE)\]/g, '').trim();
    if (!text) continue;
    if ((m = text.match(/^(#{2,3})\s+(.+)$/))) { close(); out += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; continue; }
    if ((m = text.match(/^[-*]\s+(.+)$/))) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = text.match(/^\d+\.\s+(.+)$/))) { if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
    close();
    out += `<p>${inline(text)}</p>`;
  }
  close();
  return out;
}

const bodies = await loadBodies(articles);

for (const a of articles) {
  const routePath = SWIPE_SLUGS.has(a.slug) ? `/read/${a.slug}` : `/article/${a.slug}`;
  const url       = SITE + routePath;
  const lastmod   = (a.published_at || today).slice(0, 10);
  const body      = bodies.get(a.slug);
  const section   = a.category ? sectionLabel(a.category) : null;

  const html = buildPage(template, {
    path: routePath,
    title: `${a.title} | SSBCircle`,
    description: a.summary,
    heading: a.title,
    blurb: a.summary,
    noscriptExtra: body ? articleHtml(body) : '',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: a.title,
          description: a.summary,
          datePublished: a.published_at || undefined,
          dateModified: a.published_at || undefined,
          articleSection: section || undefined,
          keywords: (a.tags || []).join(', ') || undefined,
          wordCount: body ? body.split(/\s+/).length : undefined,
          image: `${SITE}/og-image.png`,
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          author:    { '@type': 'Organization', name: 'SSBCircle', url: SITE },
          publisher: {
            '@type': 'Organization',
            name: 'SSBCircle',
            logo: { '@type': 'ImageObject', url: `${SITE}/og-image.png` },
          },
          inLanguage: 'en-IN',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'SSBCircle', item: `${SITE}/` },
            { '@type': 'ListItem', position: 2, name: 'News Cards', item: `${SITE}/current-affairs` },
            { '@type': 'ListItem', position: 3, name: a.title, item: url },
          ],
        },
      ],
    },
  });

  writePage(routePath, html);
  sitemap.push({ path: routePath, lastmod, changefreq: 'monthly', priority: '0.8' });
}

for (const m of MENTORS) {
  const routePath = `/mentor/${m.slug}`;
  const title     = `${m.name} — SSB Mentor | SSBCircle`;
  const html = buildPage(template, {
    path: routePath,
    title,
    description: m.bio,
    heading: m.name,
    blurb: m.bio,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: m.name,
        jobTitle: m.tagline,
        description: m.bio,
        url: SITE + routePath,
      },
    },
  });
  writePage(routePath, html);
  sitemap.push({ path: routePath, lastmod: today, changefreq: 'monthly', priority: '0.7' });
}

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(sitemap));

console.log(`prerender: ${sitemap.length} indexable pages, ${STATIC_ROUTES.filter(r => r.noindex).length} noindex pages, sitemap.xml written`);
