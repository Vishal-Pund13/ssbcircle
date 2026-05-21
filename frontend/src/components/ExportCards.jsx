import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import SceneRenderer from './SwipeReader/SceneRenderer';

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

const SCENE_LABELS = {
  hook:            'Introduction',
  concept:         'Core Concept',
  breakdown:       'Breakdown',
  two_sides:       'Two Sides',
  context:         'Big Picture',
  ssb_application: 'SSB Application',
  quiz:            'Test Yourself',
};

// Renders exactly one scene exactly as the mobile SwipeReader shows it
function CardFrame({ article, scene, sceneIndex }) {
  const total = article.scenes.length;
  const pct   = ((sceneIndex + 1) / total) * 100;
  const label = SCENE_LABELS[scene.type] || '';

  return (
    <div style={{ width: 390, height: 844, background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#f3f4f6', flexShrink: 0 }}>
        <div style={{ height: 2, background: '#1e3a5f', width: `${pct}%`, transition: 'none' }} />
      </div>

      {/* Header — dots + label + exit */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i === sceneIndex ? 16 : 6,
              height: 6, borderRadius: 99,
              background: i === sceneIndex ? '#1e3a5f' : '#e5e7eb',
            }} />
          ))}
        </div>
        <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
          {sceneIndex + 1} / {total} · {label}
        </span>
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 99, padding: '3px 10px' }}>
          Exit
        </span>
      </div>

      {/* Scene content — takes remaining space */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
          <SceneRenderer scene={scene} article={article} onClose={() => {}} />
        </div>
      </div>

      {/* Footer branding */}
      <div style={{ padding: '7px 16px', borderTop: '1px solid #f9fafb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: '#d1d5db', fontWeight: 600 }}>SSBCircle · News Cards</span>
        <span style={{ fontSize: 9, color: '#d1d5db' }}>{(article.ssb_tags || []).join(' · ')}</span>
      </div>
    </div>
  );
}

export default function ExportCards() {
  const navigate  = useNavigate();
  const renderRef = useRef(null);
  const [frame,   setFrame]   = useState(null);   // { article, scene, idx }
  const [busy,    setBusy]    = useState(false);
  const [status,  setStatus]  = useState('');

  useEffect(() => {
    if (!sessionStorage.getItem('sa_token')) navigate('/sa');
  }, [navigate]);

  async function captureFrame(article, scene, idx) {
    setFrame({ article, scene, idx });
    // Let React render, then give html2canvas time to see the DOM
    await new Promise(r => setTimeout(r, 320));

    const canvas = await html2canvas(renderRef.current, {
      scale:           2,          // 390×2 = 780px, 844×2 = 1688px
      backgroundColor: '#ffffff',
      useCORS:         true,
      logging:         false,
    });

    const a       = document.createElement('a');
    const padIdx  = String(idx + 1).padStart(2, '0');
    const type    = SCENE_LABELS[scene.type]?.toLowerCase().replace(/\s/g, '-') || scene.type;
    a.download    = `${article.id}-${padIdx}-${type}.png`;
    a.href        = canvas.toDataURL('image/png');
    a.click();

    // Brief pause so browser can start the download before next
    await new Promise(r => setTimeout(r, 250));
  }

  async function exportArticle(article) {
    setBusy(true);
    try {
      for (let i = 0; i < article.scenes.length; i++) {
        setStatus(`${article.title} — scene ${i + 1} / ${article.scenes.length}`);
        await captureFrame(article, article.scenes[i], i);
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setBusy(false);
      setStatus('');
      setFrame(null);
    }
  }

  async function exportAll() {
    setBusy(true);
    try {
      for (const article of ALL_ARTICLES) {
        for (let i = 0; i < article.scenes.length; i++) {
          setStatus(`${article.title} — ${i + 1} / ${article.scenes.length}`);
          await captureFrame(article, article.scenes[i], i);
        }
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setBusy(false);
      setStatus('');
      setFrame(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hidden render target — exact mobile card size, off-screen */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1 }}>
        <div ref={renderRef} style={{ width: 390, height: 844, overflow: 'hidden' }}>
          {frame && (
            <CardFrame
              article={frame.article}
              scene={frame.scene}
              sceneIndex={frame.idx}
            />
          )}
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
          onClick={exportAll}
          disabled={busy}
          className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {busy ? '…' : 'Export all articles'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Export Card Decks</h1>
          <p className="text-sm text-gray-500">
            Downloads each scene as a 780×1688 PNG — exactly as it appears in the app.
            One file per scene, named <code className="text-xs bg-gray-100 px-1 rounded">article-01-introduction.png</code> etc.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ARTICLES.map(article => (
            <div key={article.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{article.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {article.category} · {article.scenes.length} scenes
                  </p>
                </div>
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full shrink-0">
                  {article.scenes.length} PNGs
                </span>
              </div>

              {/* Scene list */}
              <div className="flex flex-wrap gap-1">
                {article.scenes.map((s, i) => (
                  <span key={i} className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {i + 1}. {SCENE_LABELS[s.type]}
                  </span>
                ))}
              </div>

              <button
                onClick={() => exportArticle(article)}
                disabled={busy}
                className="w-full text-xs font-semibold text-brand-600 border border-brand-200 hover:bg-brand-50 disabled:opacity-40 py-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {busy && status.startsWith(article.title)
                  ? status
                  : `Export ${article.scenes.length} cards`}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Floating status */}
      {busy && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap">
          <svg className="w-3.5 h-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {status}
        </div>
      )}
    </div>
  );
}
