import { useState, useEffect } from 'react';
import { Download, FileText, Share2, ExternalLink, X, Check } from 'lucide-react';
import { buildPiqPdf, canSharePdf, sharePdf, downloadPdf } from './piqReportPdf';
import { trackEvent } from '../analytics';

// The PIQ report's PDF button.
//
// Computers: one tap builds the file and downloads it.
// Phones: one tap builds the file, then a sheet offers "Save or share" (the
// share sheet, where iOS keeps files) and "Open PDF" (for in-app browsers such
// as WhatsApp's, where sharing a file is not available). iOS only opens the
// share sheet from a direct tap, which is why saving is a second tap.

export default function PiqPdfButton({ analysis, name, analysedAt }) {
  const [phase, setPhase] = useState('idle');   // idle | building | ready | error
  const [pdf, setPdf] = useState(null);         // { file, url }
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState(false);

  // A new analysis means a new file
  useEffect(() => { setPdf(null); setPhase('idle'); }, [analysis]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);

  async function start() {
    trackEvent('piq_pdf');
    if (pdf) { deliver(pdf); return; }
    setPhase('building');
    try {
      const built = await buildPiqPdf(analysis, { name, analysedAt });
      setPdf(built);
      setPhase('ready');
      deliver(built);
    } catch (err) {
      console.error('PIQ PDF failed:', err);
      trackEvent('piq_pdf_error', { message: String(err?.message || err).slice(0, 120) });
      setPhase('error');
    }
  }

  function deliver(built) {
    setSaved(false);
    if (canSharePdf(built.file)) setSheet(true);
    else {
      downloadPdf(built);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function share() {
    try {
      await sharePdf(pdf.file);
      trackEvent('piq_pdf_share');
      setSaved(true);
    } catch (err) {
      if (err?.name === 'AbortError') return;    // closed the share sheet
      downloadPdf(pdf);
      trackEvent('piq_pdf_share_fallback', { name: err?.name || '' });
    }
  }

  return (
    <>
      <button type="button" onClick={start} disabled={phase === 'building'}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 px-3 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-70 min-h-[36px]">
        {phase === 'building'
          ? <><span className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /> Preparing…</>
          : saved && !sheet ? <><Check className="w-3.5 h-3.5" /> Downloaded</>
          : <><Download className="w-3.5 h-3.5" /> PDF</>}
      </button>

      {phase === 'error' && (
        <p role="alert" className="mt-2 text-xs text-white/90">Could not make the PDF. Check your connection and tap PDF again.</p>
      )}

      {sheet && pdf && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="pdf-sheet-title" onClick={e => e.stopPropagation()}
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 text-gray-900"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></span>
                <div>
                  <p id="pdf-sheet-title" className="text-base font-bold">Your PDF is ready</p>
                  <p className="text-xs text-gray-500 break-all">{pdf.file.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSheet(false)} aria-label="Close"
                className="w-10 h-10 -mr-2 -mt-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <button type="button" onClick={share}
              className="mt-5 w-full btn-primary text-base py-3">
              {saved ? <><Check className="w-5 h-5" /> Shared — share again</> : <><Share2 className="w-5 h-5" /> Save or share PDF</>}
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">On iPhone, choose <span className="font-semibold">Save to Files</span> to keep it.</p>

            <a href={pdf.url} target="_blank" rel="noopener" onClick={() => trackEvent('piq_pdf_open')}
              className="mt-4 w-full btn-secondary text-base py-3">
              <ExternalLink className="w-5 h-5" /> Open PDF
            </a>
            <p className="mt-2 text-xs text-gray-500 text-center leading-relaxed">
              Opened this page from WhatsApp or Instagram? Tap the ⋯ menu and choose <span className="font-semibold">Open in Safari</span> (or Chrome), then try again.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
