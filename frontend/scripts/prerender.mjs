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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const DIST      = path.join(ROOT, 'dist');
const SITE      = 'https://www.ssbcircle.com';
const API       = process.env.VITE_API_URL || 'https://ssbcircle.onrender.com';

const today = new Date().toISOString().slice(0, 10);

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
