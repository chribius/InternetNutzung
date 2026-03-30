/* ═══════════════════════════════════════════════════════════
   MeinInternetCheck — Survey Logic
   DSGVO-konform: Alle Daten bleiben lokal im Browser.
   Keine Übertragung an externe Server.
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── State ───────────────────────────────────────────────
let currentPage = 0;
const TOTAL_PAGES = 5; // Seiten 1–5 (ohne Consent 0, Danke 6)
let surveyAnswers = {};
let chartInstances = {};

// ─── Theme Toggle ────────────────────────────────────────
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const html   = document.documentElement;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = prefersDark ? 'dark' : 'light';
  html.setAttribute('data-theme', currentTheme);
  updateToggleIcon(currentTheme, toggle);

  toggle && toggle.addEventListener('click', () => {
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    updateToggleIcon(newTheme, toggle);
  });

  function updateToggleIcon(theme, btn) {
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
      btn.setAttribute('aria-label', 'Zu Hell-Modus wechseln');
    } else {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      btn.setAttribute('aria-label', 'Zu Dunkel-Modus wechseln');
    }
  }
})();

// ─── Consent Gate ────────────────────────────────────────
function checkConsent() {
  const checked = document.getElementById('consentCheck').checked;
  document.getElementById('startBtn').disabled = !checked;
}

function startSurvey() {
  if (!document.getElementById('consentCheck').checked) return;
  surveyAnswers['_consent'] = {
    given: true,
    timestamp: new Date().toISOString(),
    note: 'Freiwillige anonyme Teilnahme, DSGVO Art. 6 Abs. 1 lit. a'
  };
  goPage(1);
}

// ─── Navigation ──────────────────────────────────────────
function goPage(n) {
  const current = document.querySelector('.survey-page.active');
  if (current) current.classList.remove('active');

  const target = document.getElementById(`page-${n}`);
  if (!target) return;
  target.classList.add('active');
  currentPage = n;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateProgress(n);
}

function updateProgress(page) {
  const bar   = document.getElementById('progressFill');
  const label = document.getElementById('progressLabel');
  const progressBar = document.getElementById('progressBar');

  if (page === 0 || page === 6) {
    if (progressBar) progressBar.style.visibility = 'hidden';
    return;
  }

  progressBar.style.visibility = 'visible';
  const percent = Math.round(((page - 1) / TOTAL_PAGES) * 100);
  bar.style.width   = percent + '%';
  label.textContent = `Seite ${page} von ${TOTAL_PAGES}`;
}

// ─── Textarea character counter ──────────────────────────
document.querySelectorAll('textarea[maxlength]').forEach(ta => {
  const countId = 'count' + ta.id.replace('q', '');
  const countEl = document.getElementById(countId);
  if (!countEl) return;
  ta.addEventListener('input', () => {
    countEl.textContent = `${ta.value.length}/${ta.maxLength}`;
  });
});

// ─── Collect answers ─────────────────────────────────────
function collectAnswers() {
  const data = { ...surveyAnswers };

  document.querySelectorAll('input[type="radio"]:checked').forEach(r => {
    data[r.name] = r.value;
  });

  const checkboxNames = new Set(
    [...document.querySelectorAll('input[type="checkbox"]')]
      .filter(c => c.name && c.name !== '')
      .map(c => c.name)
  );
  checkboxNames.forEach(name => {
    const checked = [...document.querySelectorAll(`input[type="checkbox"][name="${name}"]:checked`)]
      .map(c => c.value);
    if (checked.length > 0) data[name] = checked;
  });

  document.querySelectorAll('textarea').forEach(ta => {
    if (ta.value.trim()) data[ta.name] = ta.value.trim();
  });

  return data;
}

// ─── Submit ──────────────────────────────────────────────
function submitSurvey() {
  surveyAnswers = collectAnswers();
  goPage(6);

  const summary = document.getElementById('resultSummary');
  const total = Object.keys(surveyAnswers).filter(k => !k.startsWith('_')).length;
  summary.innerHTML = `
    <p>✅ <strong>${total} Antworten</strong> erfasst — alles bleibt auf diesem Gerät, kein Upload.</p>
    <p style="margin-top: 0.5rem; color: var(--color-text-faint); font-size: var(--text-xs);">
      Zeitstempel: ${new Date().toLocaleString('de-DE')} · vollständig anonym
    </p>
  `;
  summary.classList.add('visible');
}

// ─── CSS-Farben aus Theme lesen ───────────────────────────
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// ─── Visualisierung ──────────────────────────────────────
function showCharts() {
  const data = surveyAnswers;
  const section = document.getElementById('chartSection');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Farben
  const primary  = getCSSVar('--color-primary')  || '#4f46e5';
  const accent   = getCSSVar('--color-accent')   || '#c026d3';
  const textMuted = getCSSVar('--color-text-muted') || '#5e6490';
  const border   = getCSSVar('--color-border')   || '#c8d0eb';

  const gradeColors = {
    '1.0-1.9': '#22c55e',
    '2.0-2.4': '#84cc16',
    '2.5-2.9': '#eab308',
    '3.0-3.4': '#f97316',
    '3.5+':    '#ef4444',
  };

  // ── Chart 1: Balkendiagramm Internetnutzung Schultag ──
  const nutzungLabels = ['< 1 h', '1–2 h', '2–4 h', '4–6 h', '> 6 h'];
  const nutzungValues  = ['unter1h', '1-2h', '2-4h', '4-6h', 'über6h'];
  const q1Answer = data['q1'];
  const nutzungData = nutzungValues.map(v => v === q1Answer ? 1 : 0);

  destroyChart('chartNutzung');
  const ctx1 = document.getElementById('chartNutzung').getContext('2d');
  chartInstances['chartNutzung'] = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: nutzungLabels,
      datasets: [{
        label: 'Deine Angabe',
        data: nutzungData,
        backgroundColor: nutzungValues.map(v =>
          v === q1Answer
            ? primary
            : getCSSVar('--color-divider') || '#dde3f5'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.raw === 1 ? '← Deine Antwort' : ''
          }
        }
      },
      scales: {
        y: {
          display: false,
          max: 1.4,
        },
        x: {
          ticks: { color: textMuted, font: { size: 12, family: 'Nunito Sans' } },
          grid: { display: false },
          border: { display: false },
        }
      },
      animation: { duration: 600, easing: 'easeOutQuart' }
    }
  });

  // ── Chart 2: Streudiagramm Internetnutzung vs. Notenschnitt ──
  // Mapping: Internetzeit (Schultag) → numerischer Wert (Mitte)
  const zeitMap = {
    'unter1h': 0.5,
    '1-2h':    1.5,
    '2-4h':    3.0,
    '4-6h':    5.0,
    'über6h':  7.0,
  };
  const notenMap = {
    '1.0-1.9': 1.45,
    '2.0-2.4': 2.2,
    '2.5-2.9': 2.7,
    '3.0-3.4': 3.2,
    '3.5+':    3.8,
  };
  const notenLabels = {
    '1.0-1.9': '1,0–1,9',
    '2.0-2.4': '2,0–2,4',
    '2.5-2.9': '2,5–2,9',
    '3.0-3.4': '3,0–3,4',
    '3.5+':    '> 3,4',
  };

  const xVal = zeitMap[data['q1']];
  const yVal = notenMap[data['q17']];
  const noteKey = data['q17'];

  // Referenzpunkte: fiktive Klassenmittelwerte zur Orientierung
  // (Quelle: typische Verteilungen aus Medienstudien, JIM-Studie)
  const referenzPunkte = [
    { x: 0.5, y: 1.8, label: 'Ø Klasse' },
    { x: 1.5, y: 2.1, label: '' },
    { x: 3.0, y: 2.5, label: '' },
    { x: 5.0, y: 2.9, label: '' },
    { x: 7.0, y: 3.3, label: '' },
  ];

  destroyChart('chartKorrelation');
  const ctx2 = document.getElementById('chartKorrelation').getContext('2d');

  const datasets = [
    {
      label: 'Typischer Klassenverlauf',
      data: referenzPunkte,
      type: 'line',
      borderColor: border,
      borderWidth: 2,
      borderDash: [5, 4],
      pointRadius: 3,
      pointBackgroundColor: border,
      fill: false,
      tension: 0.35,
    }
  ];

  if (xVal !== undefined && yVal !== undefined) {
    datasets.push({
      label: 'Deine Angabe',
      data: [{ x: xVal, y: yVal }],
      type: 'scatter',
      backgroundColor: gradeColors[noteKey] || primary,
      pointRadius: 12,
      pointHoverRadius: 14,
      borderColor: 'white',
      borderWidth: 2,
    });
  }

  chartInstances['chartKorrelation'] = new Chart(ctx2, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: { color: textMuted, font: { size: 11 }, boxWidth: 14 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.dataset.label === 'Deine Angabe') {
                return `Internetzeit: ${formatZeit(data['q1'])} · Note: ${notenLabels[data['q17']] || '–'}`;
              }
              return '';
            }
          }
        },
        annotation: {}
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Internetzeit/Tag (Std.)',
            color: textMuted,
            font: { size: 11, family: 'Nunito Sans' }
          },
          min: 0, max: 8,
          ticks: {
            color: textMuted,
            font: { size: 11 },
            callback: v => v + ' h'
          },
          grid: { color: border + '55' },
        },
        y: {
          title: {
            display: true,
            text: 'Notenschnitt',
            color: textMuted,
            font: { size: 11, family: 'Nunito Sans' }
          },
          min: 1, max: 4.5,
          reverse: false,
          ticks: {
            color: textMuted,
            font: { size: 11 },
            stepSize: 0.5,
          },
          grid: { color: border + '55' },
        }
      },
      animation: { duration: 700, easing: 'easeOutQuart' }
    }
  });

  // Legende unter dem Korrelationsdiagramm
  const legendHtml = buildGradeLegend(gradeColors, notenLabels, noteKey);
  const existingLegend = document.getElementById('gradeLegend');
  if (existingLegend) existingLegend.remove();
  const legendEl = document.createElement('div');
  legendEl.id = 'gradeLegend';
  legendEl.className = 'grade-legend';
  legendEl.innerHTML = legendHtml;
  document.getElementById('chartSection').appendChild(legendEl);
}

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function buildGradeLegend(colors, labels, activeKey) {
  return `
    <div class="grade-legend-title">Notenstufen</div>
    <div class="grade-legend-items">
      ${Object.entries(labels).map(([key, label]) => `
        <span class="grade-chip ${key === activeKey ? 'active' : ''}" style="--chip-color:${colors[key]}">
          ${label}
        </span>
      `).join('')}
    </div>`;
}

function formatZeit(key) {
  const map = {
    'unter1h': '< 1 h',
    '1-2h':    '1–2 h',
    '2-4h':    '2–4 h',
    '4-6h':    '4–6 h',
    'über6h':  '> 6 h',
  };
  return map[key] || key;
}

// ─── Export ──────────────────────────────────────────────
function exportResults() {
  const data = collectAnswers();

  const questions = {
    q1:  'Stunden online (Schultag)',
    q2:  'Stunden online (Wochenende)',
    q3:  'Hauptgeräte',
    q4:  'Hauptnutzungszeiten',
    q5:  'Genutzte Apps',
    q6:  'Tägliche Social-Media-Zeit',
    q7:  'Social-Media-Zweck',
    q8:  'Gaming-Häufigkeit',
    q9:  'Spieltypen',
    q10: 'In-App-Käufe',
    q11: 'Gefühl: zu viel Zeit beim Spielen',
    q12: 'Begriff "persönliche Daten"',
    q13: 'Was wird online geteilt',
    q14: 'AGBs / Datenschutzerklärung lesen',
    q15: 'Wissen über Cookies',
    q16: 'Fake-Account-Erfahrung',
    q17: 'Notenschnitt',
  };

  const sections = [
    { title: 'ALLGEMEINE NUTZUNG',       keys: ['q1','q2','q3','q4'] },
    { title: 'SOCIAL MEDIA & APPS',      keys: ['q5','q6','q7'] },
    { title: 'GAMING',                   keys: ['q8','q9','q10','q11'] },
    { title: 'DATENSCHUTZ & SICHERHEIT', keys: ['q12','q13','q14','q15','q16'] },
    { title: 'NOTENSCHNITT',             keys: ['q17'] },
  ];

  let text = '══════════════════════════════════════════\n';
  text    += '  MeinInternetCheck – Ergebnisse\n';
  text    += '  Klasse 8 · Internetnutzungsverhalten\n';
  text    += '══════════════════════════════════════════\n\n';
  text    += `Exportiert: ${new Date().toLocaleString('de-DE')}\n`;
  text    += 'Hinweis: Vollständig anonym – keine persönlichen Daten\n\n';

  sections.forEach(sec => {
    text += `\n── ${sec.title} ──────────────────────\n`;
    sec.keys.forEach(k => {
      if (!data[k]) return;
      const val = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
      text += `\n${questions[k] || k}:\n  → ${val}\n`;
    });
  });

  text += '\n══════════════════════════════════════════\n';

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `internetcheck-${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Reset ───────────────────────────────────────────────
function resetSurvey() {
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => {
    if (c.id !== 'consentCheck') c.checked = false;
  });
  document.querySelectorAll('textarea').forEach(ta => ta.value = '');
  document.querySelectorAll('.char-count').forEach(el => el.textContent = '0/500');

  const consentCheck = document.getElementById('consentCheck');
  consentCheck.checked = false;
  document.getElementById('startBtn').disabled = true;

  surveyAnswers = {};

  // Charts zerstören
  Object.keys(chartInstances).forEach(destroyChart);

  const chartSection = document.getElementById('chartSection');
  if (chartSection) chartSection.style.display = 'none';

  const resultSummary = document.getElementById('resultSummary');
  if (resultSummary) resultSummary.classList.remove('visible');

  const legend = document.getElementById('gradeLegend');
  if (legend) legend.remove();

  goPage(0);
}

// ─── Utility ─────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─── Keyboard nav ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement) {
    const card = document.activeElement.closest('.radio-card, .checkbox-card, .app-card');
    if (card) {
      const input = card.querySelector('input');
      if (input) {
        if (input.type === 'radio') input.checked = true;
        if (input.type === 'checkbox') input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.radio-card, .checkbox-card, .app-card').forEach(card => {
    card.setAttribute('tabindex', '0');
  });
  updateProgress(0);
});
