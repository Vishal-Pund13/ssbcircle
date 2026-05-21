import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';

import rupeeData             from '../data/articles/rupee-depreciation.json';
import elNinoData            from '../data/articles/super-el-nino.json';
import womenWorkforceData    from '../data/articles/women-workforce-paradox.json';
import womenProxyData        from '../data/articles/women-proxy-representation.json';
import womenGlassCeilingData from '../data/articles/women-glass-ceiling.json';
import womenPayGapData       from '../data/articles/women-gender-pay-gap.json';
import womenSafetyData       from '../data/articles/women-safety-economy.json';
import womenEducationData    from '../data/articles/women-education-gap.json';
import womenHealthData       from '../data/articles/women-health-india.json';

const ALL_ARTICLES = [
  rupeeData, elNinoData,
  womenWorkforceData, womenProxyData, womenGlassCeilingData,
  womenPayGapData, womenSafetyData, womenEducationData, womenHealthData,
];

const CAT_COLOR = {
  'Economic':       '#1d4ed8',
  'Polity':         '#7c3aed',
  'Socio-Cultural': '#1e3a5f',
  'Geographic':     '#0f766e',
  'Defence':        '#b91c1c',
};

// ─── Instagram card templates (inline styles only — html2canvas safe) ───────

function HookCard({ article }) {
  const hook   = article.scenes.find(s => s.type === 'hook') || article.scenes[0];
  const accent = CAT_COLOR[article.category] || '#1e3a5f';
  const bg     = `${accent}12`;
  const border = `${accent}28`;

  return (
    <div style={{
      width: 540, height: 540,
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Accent bar */}
      <div style={{ height: 5, background: accent, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '26px 36px', display: 'flex', flexDirection: 'column' }}>
        {/* Category + logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: accent,
            background: bg, border: `1px solid ${border}`,
            padding: '4px 12px', borderRadius: 99,
            textTransform: 'uppercase', letterSpacing: 1.5,
          }}>
            {article.category}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 1 }}>
            SSBCircle
          </span>
        </div>

        {/* Big stat */}
        {hook?.stat?.value && (
          <div style={{
            fontSize: 86, fontWeight: 900,
            color: accent,
            lineHeight: 1, letterSpacing: -3,
            marginBottom: 10,
          }}>
            {hook.stat.value}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontSize: 20, fontWeight: 800,
          color: '#111827', lineHeight: 1.3,
          marginBottom: 10,
        }}>
          {article.title}
        </div>

        {/* Hook headline */}
        {hook?.headline && (
          <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7, flex: 1 }}>
            {hook.headline}
          </div>
        )}

        {/* SSB tags */}
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          {(article.ssb_tags || []).map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 700, color: accent,
              background: bg, border: `1px solid ${border}`,
              padding: '3px 8px', borderRadius: 99,
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 36px', borderTop: '1px solid #f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#d1d5db' }}>ssb.circle.com</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#d1d5db' }}>SSB Prep · News Cards</span>
      </div>
    </div>
  );
}

function QuoteCard({ article }) {
  const ssbApp = article.scenes.find(s => s.type === 'ssb_application');
  const accent = CAT_COLOR[article.category] || '#1e3a5f';
  if (!ssbApp?.one_liner) return null;

  return (
    <div style={{
      width: 540, height: 540,
      background: accent,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '40px 48px',
    }}>
      {/* Opening quote */}
      <div style={{
        fontSize: 72, color: 'rgba(255,255,255,0.18)',
        lineHeight: 1, marginBottom: -18,
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}>
        "
      </div>

      {/* One liner */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{
          fontSize: 21, fontWeight: 700,
          color: '#ffffff', lineHeight: 1.6, letterSpacing: -0.3,
        }}>
          {ssbApp.one_liner}
        </div>
      </div>

      {/* Attribution */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
          {article.title}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          SSBCircle · SSB Prep News Cards
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExportCards() {
  const navigate   = useNavigate();
  const renderRef  = useRef(null);
  const [content,  setContent]  = useState(null);
  const [busy,     setBusy]     = useState(false);
  const [status,   setStatus]   = useState('');

  useEffect(() => {
    if (!sessionStorage.getItem('sa_token')) navigate('/sa');
  }, [navigate]);

  async function capture(filename, jsx) {
    setContent(jsx);
    await new Promise(r => setTimeout(r, 280));
    const canvas = await html2canvas(renderRef.current, {
      scale: 2, backgroundColor: null, useCORS: true, logging: false,
    });
    const a = document.createElement('a');
    a.download = filename;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  async function run(fn) {
    setBusy(true);
    try { await fn(); }
    catch (e) { alert('Export failed: ' + e.message); }
    finally { setBusy(false); setStatus(''); setContent(null); }
  }

  function exportHook(article) {
    return run(async () => {
      setStatus(`Hook card — ${article.title}`);
      await capture(`ssbcircle-${article.id}-hook.png`, <HookCard article={article} />);
    });
  }

  function exportQuote(article) {
    return run(async () => {
      setStatus(`Quote card — ${article.title}`);
      await capture(`ssbcircle-${article.id}-quote.png`, <QuoteCard article={article} />);
    });
  }

  function exportAllHooks() {
    return run(async () => {
      for (const a of ALL_ARTICLES) {
        setStatus(`Hook card — ${a.title}`);
        await capture(`ssbcircle-${a.id}-hook.png`, <HookCard article={a} />);
        await new Promise(r => setTimeout(r, 350));
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hidden render target — off-screen, exact card size */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1 }}>
        <div ref={renderRef} style={{ width: 540, height: 540, overflow: 'hidden' }}>
          {content}
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/sa/dashboard" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            ← Dashboard
          </Link>
          <span className="text-gray-200 text-xs">/</span>
          <span className="text-xs font-semibold text-gray-800">Export Cards</span>
        </div>
        <button
          onClick={exportAllHooks}
          disabled={busy}
          className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {busy ? status : 'Export all hook cards'}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Export for Instagram</h1>
          <p className="text-sm text-gray-500">
            Downloads 1080×1080 PNG — two formats per article.
            <span className="font-semibold text-gray-700"> Hook card</span>: big stat + headline.
            <span className="font-semibold text-gray-700"> Quote card</span>: GD one-liner on navy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ARTICLES.map(article => {
            const hasQuote = article.scenes.some(s => s.type === 'ssb_application' && s.one_liner);
            const accent   = CAT_COLOR[article.category] || '#1e3a5f';
            const hook     = article.scenes.find(s => s.type === 'hook');

            return (
              <div key={article.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                {/* Mini preview */}
                <div className="h-36 bg-gray-50 border-b border-gray-100 overflow-hidden relative">
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%) scale(0.24)',
                    width: 540, height: 540, pointerEvents: 'none',
                  }}>
                    <HookCard article={article} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{article.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{article.category} · {article.scenes.length} scenes</p>
                    </div>
                    <span className="text-xl font-extrabold shrink-0" style={{ color: accent }}>
                      {hook?.stat?.value}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => exportHook(article)}
                      disabled={busy}
                      className="flex-1 text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 disabled:opacity-40 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Hook card
                    </button>
                    {hasQuote && (
                      <button
                        onClick={() => exportQuote(article)}
                        disabled={busy}
                        className="flex-1 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Quote card
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {busy && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {status}
          </div>
        )}
      </main>
    </div>
  );
}
