import { INFOGRAPHICS } from './ArticleInfographics';

// Parse **bold** text inline
function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-bold text-gray-900">{p.slice(2, -2)}</strong>
      : p
  );
}

// Render a single line as inline content
function Inline({ text }) {
  return <>{parseBold(text)}</>;
}

// Parse an array of content lines into rich React blocks. Used for the
// top-level article body, and recursively for content nested inside [DETAILS].
function parseBlocks(lines, keyPrefix = '') {
  const blocks = [];
  let   i      = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── [CALLOUT]...[/CALLOUT] ─────────────────────────────────────────────
    if (line.startsWith('[CALLOUT]')) {
      const inner = line.replace('[CALLOUT]', '').replace('[/CALLOUT]', '').trim();
      blocks.push(
        <div key={keyPrefix + i} className="my-6 flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-4">
          <span className="text-brand-600 text-lg shrink-0 mt-0.5">💡</span>
          <p className="text-sm text-brand-800 leading-relaxed italic">{inner}</p>
        </div>
      );
      i++; continue;
    }

    // ── [INFOGRAPHIC:N] ────────────────────────────────────────────────────
    const infMatch = line.match(/^\[INFOGRAPHIC:(\d+)\]$/);
    if (infMatch) {
      const Component = INFOGRAPHICS[parseInt(infMatch[1])];
      if (Component) blocks.push(<Component key={keyPrefix + i} />);
      i++; continue;
    }

    // ── [SSB-GD]...[/SSB-GD] ──────────────────────────────────────────────
    if (line.startsWith('[SSB-GD]')) {
      const collected = [];
      let txt = line.replace('[SSB-GD]', '');
      while (i < lines.length && !lines[i].includes('[/SSB-GD]')) {
        collected.push(lines[i]);
        i++;
      }
      collected.push(lines[i]?.replace('[/SSB-GD]', '') || '');
      const raw = (txt + '\n' + collected.join('\n')).replace('[/SSB-GD]', '').trim();
      blocks.push(
        <SSBCallout key={keyPrefix + i} type="gd" title="In a Group Discussion">
          {raw}
        </SSBCallout>
      );
      i++; continue;
    }

    // ── [SSB-LECTURETTE]...[/SSB-LECTURETTE] ──────────────────────────────
    if (line.startsWith('[SSB-LECTURETTE]')) {
      const collected = [line.replace('[SSB-LECTURETTE]', '')];
      i++;
      while (i < lines.length && !lines[i].includes('[/SSB-LECTURETTE]')) {
        collected.push(lines[i]);
        i++;
      }
      collected.push(lines[i]?.replace('[/SSB-LECTURETTE]', '') || '');
      const raw = collected.join('\n').trim();
      blocks.push(<SSBCallout key={keyPrefix + i} type="lecturette" title="Lecturette Structure">{raw}</SSBCallout>);
      i++; continue;
    }

    // ── [SSB-PI]...[/SSB-PI] ──────────────────────────────────────────────
    if (line.startsWith('[SSB-PI]')) {
      const collected = [line.replace('[SSB-PI]', '')];
      i++;
      while (i < lines.length && !lines[i].includes('[/SSB-PI]')) {
        collected.push(lines[i]);
        i++;
      }
      collected.push(lines[i]?.replace('[/SSB-PI]', '') || '');
      const raw = collected.join('\n').trim();
      blocks.push(<SSBCallout key={keyPrefix + i} type="pi" title="Personal Interview Answer">{raw}</SSBCallout>);
      i++; continue;
    }

    // ── [KEY-TERMS]...[/KEY-TERMS] ─────────────────────────────────────────
    if (line.startsWith('[KEY-TERMS]')) {
      const terms = [];
      i++;
      while (i < lines.length && !lines[i].includes('[/KEY-TERMS]')) {
        const parts = lines[i].split('|');
        if (parts.length === 2) terms.push({ term: parts[0].trim(), def: parts[1].trim() });
        i++;
      }
      blocks.push(<KeyTermsBlock key={keyPrefix + i} terms={terms} />);
      i++; continue;
    }

    // ── [QUOTE]text|author[/QUOTE] ─────────────────────────────────────────
    if (line.startsWith('[QUOTE]')) {
      const raw = line.replace('[QUOTE]', '').replace('[/QUOTE]', '').trim();
      const [text, author] = raw.split('|');
      blocks.push(<PullQuote key={keyPrefix + i} text={text.trim()} author={author?.trim()} />);
      i++; continue;
    }

    // ── [COMPARE:Left|Right] rows [/COMPARE] — side-by-side contrast ───────
    const cmpMatch = line.match(/^\[COMPARE:([^|]+)\|(.+)\]$/);
    if (cmpMatch) {
      const rows = [];
      i++;
      while (i < lines.length && !lines[i].includes('[/COMPARE]')) {
        const parts = lines[i].split('|');
        if (parts.length === 2) rows.push({ left: parts[0].trim(), right: parts[1].trim() });
        i++;
      }
      blocks.push(
        <CompareBlock key={keyPrefix + i}
          leftTitle={cmpMatch[1].trim()} rightTitle={cmpMatch[2].trim()} rows={rows} />
      );
      i++; continue;
    }

    // ── [IMAGE:src|caption] ────────────────────────────────────────────────
    const imgMatch = line.match(/^\[IMAGE:([^|]+)(?:\|(.*))?\]$/);
    if (imgMatch) {
      blocks.push(<ArticleImage key={keyPrefix + i} src={imgMatch[1].trim()} caption={imgMatch[2]?.trim()} />);
      i++; continue;
    }

    // ── [DETAILS:label]...[/DETAILS] — collapsed "go deeper" section ───────
    const detailsMatch = line.match(/^\[DETAILS:(.*)\]$/);
    if (detailsMatch) {
      const label = detailsMatch[1].trim() || 'Read more';
      i++;
      const inner = [];
      while (i < lines.length && lines[i].trim() !== '[/DETAILS]') {
        inner.push(lines[i]);
        i++;
      }
      i++; // skip closing tag
      blocks.push(
        <DetailsBlock key={keyPrefix + i} label={label}>
          {parseBlocks(inner, keyPrefix + i + '-')}
        </DetailsBlock>
      );
      continue;
    }

    // ── ## H2 ──────────────────────────────────────────────────────────────
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={keyPrefix + i} className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-4 leading-snug">
          {line.slice(3)}
        </h2>
      );
      i++; continue;
    }

    // ── ### H3 ─────────────────────────────────────────────────────────────
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={keyPrefix + i} className="text-base sm:text-lg font-bold text-brand-700 mt-7 mb-3">
          {line.slice(4)}
        </h3>
      );
      i++; continue;
    }

    // ── > Blockquote ───────────────────────────────────────────────────────
    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={keyPrefix + i} className="my-4 pl-4 border-l-4 border-brand-300">
          <p className="text-sm text-brand-800 italic leading-relaxed">{line.slice(2)}</p>
        </blockquote>
      );
      i++; continue;
    }

    // ── Bullet list ────────────────────────────────────────────────────────
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={keyPrefix + i} className="my-4 space-y-2 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-2" />
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Empty line ─────────────────────────────────────────────────────────
    if (line.trim() === '') { i++; continue; }

    // ── Regular paragraph ──────────────────────────────────────────────────
    blocks.push(
      <p key={keyPrefix + i} className="text-sm sm:text-[15px] text-gray-700 leading-relaxed my-3">
        <Inline text={line} />
      </p>
    );
    i++;
  }

  return blocks;
}

// Parse and render the article content string into rich React elements
export default function ArticleRenderer({ content }) {
  return <div className="article-body">{parseBlocks(content.split('\n'))}</div>;
}

// SSB Callout cards — all use the same brand-50 base, differentiated by label only
function SSBCallout({ type, title, children }) {
  const labels = { gd: 'GD', lecturette: 'Lecturette', pi: 'PI' };
  const raw    = typeof children === 'string' ? children : '';
  const paras  = raw.split('\n').filter(l => l.trim());

  return (
    <div className="my-6 border border-brand-100 bg-brand-50 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-brand-100 bg-white">
        <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
          {labels[type] || type}
        </span>
        <span className="text-xs font-bold text-gray-800">{title}</span>
      </div>
      <div className="px-4 py-4 space-y-2.5">
        {paras.map((line, i) => {
          const numMatch = line.match(/^(\d+)\.\s(.+)/);
          if (numMatch) {
            return (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {numMatch[1]}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed"><Inline text={numMatch[2]} /></p>
              </div>
            );
          }
          return (
            <p key={i} className="text-sm text-gray-700 leading-relaxed">
              <Inline text={line} />
            </p>
          );
        })}
      </div>
    </div>
  );
}

// Key Terms — same card style as "How it works" steps
function KeyTermsBlock({ terms }) {
  if (!terms.length) return null;
  return (
    <div className="my-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Key Terms Cheat Sheet</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {terms.map((t, i) => (
          <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-brand-100 transition-colors">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full shrink-0 mt-0.5 whitespace-nowrap">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="text-xs font-bold text-gray-900">{t.term}</p>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{t.def}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inline photo with optional caption
function ArticleImage({ src, caption }) {
  return (
    <figure className="my-6">
      <img src={src} alt={caption || ''} loading="lazy" className="w-full rounded-xl border border-gray-100" />
      {caption && <figcaption className="text-xs text-gray-400 mt-2 text-center">{caption}</figcaption>}
    </figure>
  );
}

// Collapsed "go deeper" section — closed by default so a skim-reader sees only
// the short version, but the full breakdown is one tap away.
function DetailsBlock({ label, children }) {
  return (
    <details className="my-6 border border-gray-200 rounded-xl overflow-hidden group">
      <summary className="cursor-pointer list-none px-4 py-3.5 flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="text-sm font-bold text-gray-800">{label}</span>
        <svg className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pt-1 pb-4">{children}</div>
    </details>
  );
}

// Side-by-side contrast — e.g. hard power vs soft power
function CompareBlock({ leftTitle, rightTitle, rows }) {
  if (!rows.length) return null;
  return (
    <div className="my-8 border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
        <div className="bg-gray-100 px-3 sm:px-4 py-3">
          <p className="text-[11px] sm:text-xs font-bold text-gray-700 uppercase tracking-wide">{leftTitle}</p>
        </div>
        <div className="bg-brand-50 px-3 sm:px-4 py-3">
          <p className="text-[11px] sm:text-xs font-bold text-brand-700 uppercase tracking-wide">{rightTitle}</p>
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="px-3 sm:px-4 py-3 bg-white">
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">{r.left}</p>
            </div>
            <div className="px-3 sm:px-4 py-3 bg-brand-50/30">
              <p className="text-[11px] sm:text-xs text-gray-700 leading-relaxed font-medium">{r.right}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pull quote — matches the "Intentionally limited" section style in LandingPage
function PullQuote({ text, author }) {
  return (
    <div className="my-8 border border-brand-100 bg-brand-50 rounded-2xl px-6 py-5">
      <div className="flex items-start gap-3">
        <span className="text-4xl text-brand-200 font-serif leading-none shrink-0 -mt-1">"</span>
        <div>
          <p className="text-sm sm:text-base font-semibold text-brand-800 leading-relaxed">{text}</p>
          {author && (
            <p className="text-xs text-brand-600/80 mt-2.5 font-medium">— {author}</p>
          )}
        </div>
      </div>
    </div>
  );
}
