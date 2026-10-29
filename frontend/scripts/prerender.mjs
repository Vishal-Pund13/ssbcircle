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
    description: 'Scheduled live SSB practice sessions — GD, PPDT, Lecturette and IO mock interviews with real defence aspirants. Free to join, straight from your browser.',
    priority: '0.7', changefreq: 'daily',
    heading: 'Upcoming live SSB practice sessions',
    blurb: 'Scheduled GD, PPDT, Lecturette and IO mock interview sessions you can join free with other NDA, CDS and AFCAT aspirants.',
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
    title: 'Create a Free SSBCircle Account — Start SSB Practice | SSBCircle',
    description: 'Sign up free with Google and start practising SSB Group Discussion, PPDT, Lecturette and IO mock interviews in live voice rooms with real defence aspirants.',
    priority: '0.7', changefreq: 'monthly',
    heading: 'Join SSBCircle free',
    blurb: 'Create a free account and start practising SSB GD, PPDT, Lecturette and IO mock interviews with real aspirants. No subscription, no paywall.',
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
        <p style="margin-top:24px;"><a href="${SITE}/">SSBCircle — free SSB interview practice with real aspirants</a></p>
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
const template = fs.readFileSync(templatePath, 'utf8');

console.log('prerender: generating per-route HTML');
const articles = await loadArticles();
const sitemap  = [];

for (const route of STATIC_ROUTES) {
  if (!route.keepTemplateHead) writePage(route.path, buildPage(template, route));
  if (!route.noindex) {
    sitemap.push({ path: route.path, lastmod: today, changefreq: route.changefreq, priority: route.priority });
  }
}

for (const a of articles) {
  const routePath = SWIPE_SLUGS.has(a.slug) ? `/read/${a.slug}` : `/article/${a.slug}`;
  const url       = SITE + routePath;
  const lastmod   = (a.published_at || today).slice(0, 10);

  const html = buildPage(template, {
    path: routePath,
    title: `${a.title} | SSBCircle`,
    description: a.summary,
    heading: a.title,
    blurb: a.summary,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: a.summary,
      datePublished: a.published_at || undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author:    { '@type': 'Organization', name: 'SSBCircle', url: SITE },
      publisher: {
        '@type': 'Organization',
        name: 'SSBCircle',
        logo: { '@type': 'ImageObject', url: `${SITE}/og-image.png` },
      },
      inLanguage: 'en-IN',
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
