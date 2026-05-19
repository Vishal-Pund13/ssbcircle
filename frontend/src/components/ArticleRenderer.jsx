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

// Parse and render the article content string into rich React elements
export default function ArticleRenderer({ content }) {
  const lines  = content.split('\n');
  const blocks = [];
  let   i      = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── [CALLOUT]...[/CALLOUT] ─────────────────────────────────────────────
    if (line.startsWith('[CALLOUT]')) {
      const end   = content.indexOf('[/CALLOUT]', content.indexOf('[CALLOUT]'));
      const inner = line.replace('[CALLOUT]', '').replace('[/CALLOUT]', '').trim();
      blocks.push(
        <div key={i} className="my-6 flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-4">
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
      if (Component) blocks.push(<Component key={i} />);
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
        <SSBCallout key={i} type="gd" title="In a Group Discussion">
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
      blocks.push(<SSBCallout key={i} type="lecturette" title="Lecturette Structure">{raw}</SSBCallout>);
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
      blocks.push(<SSBCallout key={i} type="pi" title="Personal Interview Answer">{raw}</SSBCallout>);
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
      blocks.push(<KeyTermsBlock key={i} terms={terms} />);
      i++; continue;
    }

    // ── [QUOTE]...[/QUOTE] ─────────────────────────────────────────────────
    if (line.startsWith('[QUOTE]')) {
      const text = line.replace('[QUOTE]', '').replace('[/QUOTE]', '').trim();
      blocks.push(<PullQuote key={i} text={text} />);
      i++; continue;
    }

    // ── ## H2 ──────────────────────────────────────────────────────────────
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={i} className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-4 leading-snug">
          {line.slice(3)}
        </h2>
      );
      i++; continue;
    }

    // ── ### H3 ─────────────────────────────────────────────────────────────
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={i} className="text-base sm:text-lg font-bold text-brand-700 mt-7 mb-3">
          {line.slice(4)}
        </h3>
      );
      i++; continue;
    }

    // ── > Blockquote ───────────────────────────────────────────────────────
    if (line.startsWith('> ')) {
      blocks.push(
        <blockquote key={i} className="my-4 pl-4 border-l-4 border-brand-300">
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
        <ul key={i} className="my-4 space-y-2 pl-1">
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
      <p key={i} className="text-sm sm:text-[15px] text-gray-700 leading-relaxed my-3">
        <Inline text={line} />
      </p>
    );
    i++;
  }

  return <div className="article-body">{blocks}</div>;
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

// Pull quote — matches the "Intentionally limited" section style in LandingPage
function PullQuote({ text }) {
  return (
    <div className="my-8 border border-brand-100 bg-brand-50 rounded-2xl px-6 py-5">
      <div className="flex items-start gap-3">
        <span className="text-4xl text-brand-200 font-serif leading-none shrink-0 -mt-1">"</span>
        <p className="text-sm sm:text-base font-semibold text-brand-800 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
