// Builds the PIQ report as a real PDF file in the browser, and hands it to the
// aspirant in the way their device handles best.
//
// The first version opened the browser's print dialog from a hidden iframe and
// relied on "Save as PDF". That never worked on iPhones: iOS Safari does not
// print a hidden frame, blocks print() that is not directly tied to a tap, and
// the in-app browsers of WhatsApp and Instagram — where many aspirants open our
// links — have no print at all. A generated file works everywhere.
//
// pdfmake keeps the text sharp and selectable, breaks pages on its own and
// draws the ssbcircle.com watermark on every page. It is about 1 MB with its
// font, so it is loaded only when someone asks for a PDF.

const LEADERSHIP = [
  ['understanding', 'Understanding', 'Seeing a situation fully, from all sides'],
  ['character',     'Character',     'Caring about people, not only yourself'],
  ['solutions',     'Solutions',     'Bringing your own ideas to change things'],
];

const BRAND = '#1e3a5f';
const MUTED = '#6b7280';

const s = v => String(v ?? '');

// An empty square to tick with a pen, beside one thing to work on. The report
// is meant to be printed and used as a blueprint, so every point that needs
// work gets one.
function checkRow(body, { size = 9, top = 2, gap = 6, margin = [0, 0, 0, 4] } = {}) {
  return {
    columns: [
      { width: size + gap, canvas: [{ type: 'rect', x: 0, y: top, w: size, h: size, r: 1.5, lineWidth: 0.9, lineColor: '#6b7280' }] },
      { width: '*', stack: Array.isArray(body) ? body : [body] },
    ],
    columnGap: 0, margin,
  };
}

function docDefinition(analysis, name, analysedAt) {
  const content = [];
  const lead = analysis.leadership;

  content.push(
    { text: 'SSBCIRCLE', style: 'brand' },
    { text: `PIQ Report${name ? ` — ${s(name)}` : ''}`, style: 'title' },
  );
  if (analysedAt) content.push({ text: `Analysed ${new Date(analysedAt).toLocaleString('en-IN')}`, style: 'muted' });
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1.5, lineColor: BRAND }], margin: [0, 0, 0, 10] });

  content.push({
    table: { widths: ['*'], body: [[{
      stack: [
        { text: 'Serious about your SSB? Make this your blueprint.', bold: true, color: '#92400e' },
        { text: 'Print this report and keep it where you prepare. Tick each box as you work on a point, come back to it every week, and keep improving your weak areas until every box is ticked.', color: '#78350f', fontSize: 9.5, margin: [0, 2, 0, 0] },
      ],
      fillColor: '#fffbeb', margin: [8, 6, 8, 6],
    }]] },
    layout: { hLineColor: () => '#fde68a', vLineColor: () => '#fde68a' },
    margin: [0, 0, 0, 10],
  });

  if (analysis.summary) {
    content.push({
      table: { widths: ['*'], body: [[{
        stack: [{ text: 'What an IO will see first', style: 'h3' }, { text: s(analysis.summary) }],
        fillColor: '#eef2ff', margin: [8, 6, 8, 6],
      }]] },
      layout: { hLineColor: () => '#e0e7ff', vLineColor: () => '#e0e7ff' },
    });
  }

  if (lead) {
    content.push({ text: 'Your leadership check', style: 'h2' });
    content.push({ text: 'A leader understands a situation, cares enough to feel it must change, and brings a solution.', style: 'note' });
    for (const [k, label, hint] of LEADERSHIP.filter(([k]) => lead[k])) {
      content.push({
        unbreakable: true, margin: [0, 0, 0, 8],
        stack: [
          { text: [{ text: label, bold: true }, { text: `  ${hint}`, color: MUTED, fontSize: 9 }] },
          { text: s(lead[k].seen), margin: [0, 2, 0, 0] },
          { ...checkRow({ text: [{ text: 'Grow it: ', bold: true }, s(lead[k].grow)], color: BRAND }), margin: [0, 3, 0, 0] },
        ],
      });
    }
  }

  if (analysis.strengths?.length) {
    content.push({ text: 'Your strong points', style: 'h2' });
    content.push({ ul: analysis.strengths.map(x => typeof x === 'string'
      ? x
      : { stack: [{ text: s(x.point), bold: true }, x.evidence ? { text: `From your PIQ: ${s(x.evidence)}`, style: 'small' } : null].filter(Boolean) }),
      margin: [0, 0, 0, 4] });
  }

  if (analysis.likely_questions?.length) {
    // The heading travels with the first group, so it is never left alone at
    // the bottom of a page
    const heading = [
      { text: 'Questions you are likely to get', style: 'h2' },
      { text: 'An IO often asks many questions in one go. Spot the group and answer each part truthfully. Tick a question once you can answer it out loud.', style: 'note' },
    ];
    analysis.likely_questions.forEach((g, i) => {
      content.push({
        unbreakable: (g.questions || []).length <= 8, margin: [0, 0, 0, 8],
        stack: [
          ...(i === 0 ? heading : []),
          { text: `${i + 1}. ${s(g.area)}`, style: 'h3' },
          ...(g.questions || []).map(q => checkRow({ text: s(q) }, { margin: [0, 0, 0, 3] })),
          g.tip ? { text: [{ text: 'How to answer: ', bold: true }, s(g.tip)], style: 'small', margin: [0, 3, 0, 0] } : null,
        ].filter(Boolean),
      });
    });
  }

  if (analysis.gaps?.length) {
    content.push({ text: 'Where the IO will press you', style: 'h2' });
    content.push({ text: 'Your weak areas. Tick each one when you have worked on it.', style: 'note' });
    for (const g of analysis.gaps) {
      content.push({
        unbreakable: true,
        ...checkRow([
          { text: s(g.issue), bold: true },
          g.why ? { text: s(g.why), style: 'small', color: MUTED } : null,
          g.fix ? { text: `Do this: ${s(g.fix)}`, style: 'small', color: BRAND } : null,
        ].filter(Boolean), { size: 10, top: 1.5, margin: [0, 0, 0, 8] }),
      });
    }
  }

  if (analysis.practice?.length) {
    content.push({ text: 'Practice for the coming days', style: 'h2' });
    content.push({ text: 'Small exercises built on your own life. Do them daily, and tick each once it has become a habit.', style: 'note' });
    for (const [i, p] of analysis.practice.entries()) {
      content.push(checkRow([{ text: `${i + 1}. ${s(p.title)}`, bold: true }, { text: s(p.task), style: 'small' }], { size: 10, top: 1.5, margin: [0, 0, 0, 6] }));
    }
  }

  content.push({
    margin: [0, 16, 0, 0], style: 'small', color: MUTED,
    text: ['Practice guidance based on what you wrote, not a real assessment. Be honest on the day; keep improving.\nPrepare free at ', { text: 'ssbcircle.com', bold: true }],
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 44, 40, 48],
    info: { title: `SSBCircle PIQ Report${name ? ` - ${s(name)}` : ''}`, author: 'SSBCircle' },
    watermark: { text: 'ssbcircle.com', color: BRAND, opacity: 0.07, bold: true, angle: -30 },
    footer: (page, pages) => ({ text: `ssbcircle.com  ·  ${page} / ${pages}`, alignment: 'center', fontSize: 8, color: MUTED, margin: [0, 16, 0, 0] }),
    content,
    defaultStyle: { fontSize: 10.5, lineHeight: 1.3, color: '#1f2937' },
    styles: {
      brand: { fontSize: 9, bold: true, color: BRAND, characterSpacing: 1.5 },
      title: { fontSize: 18, bold: true, color: '#111827', margin: [0, 2, 0, 2] },
      h2:    { fontSize: 13, bold: true, color: BRAND, margin: [0, 14, 0, 4] },
      h3:    { fontSize: 11, bold: true, color: '#111827', margin: [0, 0, 0, 3] },
      note:  { fontSize: 9.5, color: MUTED, margin: [0, 0, 0, 6] },
      muted: { fontSize: 9.5, color: MUTED },
      small: { fontSize: 9.5 },
    },
  };
}

let pdfMakePromise;
function loadPdfMake() {
  pdfMakePromise ??= Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')])
    .then(([pm, fonts]) => {
      const pdfMake = pm.default || pm;
      const f = fonts.default || fonts;
      pdfMake.vfs = f.pdfMake?.vfs || f.vfs || f;
      return pdfMake;
    });
  return pdfMakePromise;
}

// Returns { file, url } for the finished PDF.
export async function buildPiqPdf(analysis, { name = '', analysedAt = null } = {}) {
  const pdfMake = await loadPdfMake();
  const blob = await new Promise((resolve, reject) => {
    try { pdfMake.createPdf(docDefinition(analysis, name, analysedAt)).getBlob(resolve); }
    catch (err) { reject(err); }
  });
  const safe = s(name).replace(/[^\w -]+/g, '').trim().replace(/\s+/g, '-');
  const filename = `SSBCircle-PIQ-Report${safe ? `-${safe}` : ''}.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });
  return { file, url: URL.createObjectURL(file) };
}

// Phones (and tablets) get the share sheet — "Save to Files", WhatsApp, Mail —
// which is the only reliable way to keep a file on iOS. It must be called
// straight from a tap, so the page builds the file first and asks for a
// second tap to save it.
export function canSharePdf(file) {
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  try { return !!(touch && navigator.canShare?.({ files: [file] })); } catch { return false; }
}

export async function sharePdf(file) {
  await navigator.share({ files: [file], title: 'My SSBCircle PIQ report' });
}

export function downloadPdf({ file, url }) {
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
