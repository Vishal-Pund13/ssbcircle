// Turns a PIQ report into a print-ready page and opens the browser's print
// dialog, where "Save as PDF" gives the aspirant a file.
//
// Printing beats drawing the report onto a canvas: the text stays sharp and
// selectable, pages break cleanly, and there is no PDF library to ship. The
// page is built in a hidden iframe so popup blockers never get involved.
//
// The ssbcircle.com watermark is position: fixed, which browsers repeat on
// every printed page.

const esc = v => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const LEADERSHIP = [
  ['understanding', 'Understanding', 'Seeing a situation fully, from all sides'],
  ['character',     'Character',     'Caring about people, not only yourself'],
  ['solutions',     'Solutions',     'Bringing your own ideas to change things'],
];

function body(analysis, name, analysedAt) {
  const parts = [];
  const lead = analysis.leadership;

  parts.push(`
    <header>
      <div class="brand">SSBCircle</div>
      <h1>PIQ Report${name ? ` — ${esc(name)}` : ''}</h1>
      ${analysedAt ? `<p class="muted">Analysed ${esc(new Date(analysedAt).toLocaleString('en-IN'))}</p>` : ''}
    </header>`);

  if (analysis.summary) {
    parts.push(`<section class="box"><h3>What an IO will see first</h3><p>${esc(analysis.summary)}</p></section>`);
  }

  if (lead) {
    parts.push(`<section><h2>Your leadership check</h2>
      <p class="note">A leader understands a situation, cares enough to feel it must change, and brings a solution.</p>
      <div class="cards">${LEADERSHIP.filter(([k]) => lead[k]).map(([k, label, hint]) => `
        <div class="card">
          <h3>${label}</h3><p class="muted small">${hint}</p>
          <p>${esc(lead[k].seen)}</p>
          <p class="grow"><b>Grow it:</b> ${esc(lead[k].grow)}</p>
        </div>`).join('')}
      </div></section>`);
  }

  if (analysis.strengths?.length) {
    parts.push(`<section><h2>Your strong points</h2><ul>${analysis.strengths.map(s => typeof s === 'string'
      ? `<li>${esc(s)}</li>`
      : `<li><b>${esc(s.point)}</b>${s.evidence ? `<br><span class="muted small">From your PIQ: ${esc(s.evidence)}</span>` : ''}</li>`
    ).join('')}</ul></section>`);
  }

  if (analysis.likely_questions?.length) {
    parts.push(`<section><h2>Questions you are likely to get</h2>
      <p class="note">An IO often asks many questions in one go. Spot the group and answer each part truthfully.</p>
      ${analysis.likely_questions.map((g, i) => `
        <div class="group">
          <h3>${i + 1}. ${esc(g.area)}</h3>
          <ul>${(g.questions || []).map(q => `<li>${esc(q)}</li>`).join('')}</ul>
          ${g.tip ? `<p class="small"><b>How to answer:</b> ${esc(g.tip)}</p>` : ''}
        </div>`).join('')}
    </section>`);
  }

  if (analysis.gaps?.length) {
    parts.push(`<section><h2>Where the IO will press you</h2>${analysis.gaps.map(g => `
      <div class="gap">
        <b>${esc(g.issue)}</b>
        ${g.why ? `<p class="muted small">${esc(g.why)}</p>` : ''}
        ${g.fix ? `<p class="small grow">Do this: ${esc(g.fix)}</p>` : ''}
      </div>`).join('')}</section>`);
  }

  if (analysis.practice?.length) {
    parts.push(`<section><h2>Practice for the coming days</h2>
      <p class="note">Small exercises built on your own life. Do them daily.</p>
      <ol>${analysis.practice.map(p => `<li><b>${esc(p.title)}</b><br><span class="small">${esc(p.task)}</span></li>`).join('')}</ol>
    </section>`);
  }

  parts.push(`<footer>Practice guidance based on what you wrote, not a real assessment. Be honest on the day; keep improving.<br>
    Prepare free at <b>ssbcircle.com</b></footer>`);

  return parts.join('\n');
}

const STYLES = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1f2937;
         font-size: 11.5pt; line-height: 1.5; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
               font-size: 64pt; font-weight: 800; letter-spacing: 2px; color: #1e3a5f; opacity: 0.09;
               filter: blur(2px); white-space: nowrap; pointer-events: none; z-index: 0; }
  main { position: relative; z-index: 1; }
  header { border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; margin-bottom: 14px; }
  .brand { color: #1e3a5f; font-weight: 800; font-size: 10pt; letter-spacing: 1.5px; text-transform: uppercase; }
  h1 { font-size: 18pt; margin: 4px 0 2px; color: #111827; }
  h2 { font-size: 13pt; color: #1e3a5f; margin: 18px 0 4px; }
  h3 { font-size: 11.5pt; margin: 0 0 4px; color: #111827; }
  p { margin: 4px 0; }
  ul, ol { margin: 6px 0; padding-left: 20px; }
  li { margin: 3px 0; }
  .muted { color: #6b7280; }
  .small { font-size: 10pt; }
  .note { color: #6b7280; font-size: 10pt; margin-bottom: 8px; }
  .grow { color: #1e3a5f; }
  .box { background: #eef2ff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 10px 12px; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; font-size: 10pt; }
  .card .grow { border-top: 1px solid #f3f4f6; padding-top: 4px; margin-top: 6px; }
  .group { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; }
  .gap { border-left: 3px solid #fcd34d; padding-left: 10px; margin-bottom: 8px; }
  .card, .group, .gap, li { break-inside: avoid; }
  h2 { break-after: avoid; }
  footer { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 9pt; color: #6b7280; }
`;

export function downloadPiqReport(analysis, { name = '', analysedAt = null } = {}) {
  const title = `SSBCircle PIQ Report${name ? ` - ${name}` : ''}`;   // default PDF file name
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>${STYLES}</style></head>
    <body><div class="watermark">ssbcircle.com</div><main>${body(analysis, name, analysedAt)}</main></body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  doc.open(); doc.write(html); doc.close();

  // Some browsers name the saved PDF after the parent page, so borrow it briefly
  const pageTitle = document.title;
  document.title = title;
  const cleanup = () => { document.title = pageTitle; frame.remove(); };

  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    // print() blocks on desktop; mobile returns early, so give the dialog time
    setTimeout(cleanup, 1500);
  }, 250);
}
