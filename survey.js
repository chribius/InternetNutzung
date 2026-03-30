/* ═══════════════════════════════════════════════════════════
   MeinInternetCheck — Survey Logic
   DSGVO-konform: Alle Daten bleiben lokal im Browser.
   Keine Übertragung an externe Server.
═══════════════════════════════════════════════════════════ */

'use strict';

// ─── State ───────────────────────────────────────────────
let currentPage = 0;
const TOTAL_PAGES = 6; // Seiten 1–6 (ohne Consent 0, danke 7)
let surveyAnswers = {};

// ─── Theme Toggle ────────────────────────────────────────
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const html   = document.documentElement;

  // Set initial theme from system preference
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
  const btn     = document.getElementById('startBtn');
  btn.disabled  = !checked;
}

function startSurvey() {
  if (!document.getElementById('consentCheck').checked) return;
  // Record consent with timestamp (anonymized - no personal data)
  surveyAnswers['_consent'] = {
    given: true,
    timestamp: new Date().toISOString(),
    note: 'Freiwillige anonyme Teilnahme, DSGVO Art. 6 Abs. 1 lit. a'
  };
  goPage(1);
}

// ─── Navigation ──────────────────────────────────────────
function goPage(n) {
  // Hide current
  const current = document.querySelector('.survey-page.active');
  if (current) current.classList.remove('active');

  // Show target
  const target = document.getElementById(`page-${n}`);
  if (!target) return;
  target.classList.add('active');
  currentPage = n;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update progress
  updateProgress(n);
}

function updateProgress(page) {
  const bar   = document.getElementById('progressFill');
  const label = document.getElementById('progressLabel');
  const progressBar = document.getElementById('progressBar');

  if (page === 0 || page === 7) {
    // Hide on consent and thank-you
    if (progressBar) progressBar.style.visibility = 'hidden';
    return;
  }

  progressBar.style.visibility = 'visible';
  const percent = Math.round(((page - 1) / TOTAL_PAGES) * 100);
  bar.style.width   = percent + '%';
  label.textContent = `Seite ${page} von ${TOTAL_PAGES}`;
  bar.setAttribute('aria-valuenow', percent);
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

// ─── Collect all answers ─────────────────────────────────
function collectAnswers() {
  const data = { ...surveyAnswers };

  // Radio buttons
  document.querySelectorAll('input[type="radio"]:checked').forEach(r => {
    data[r.name] = r.value;
  });

  // Checkboxes (grouped by name)
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

  // Textareas
  document.querySelectorAll('textarea').forEach(ta => {
    if (ta.value.trim()) data[ta.name] = ta.value.trim();
  });

  return data;
}

// ─── Submit ──────────────────────────────────────────────
function submitSurvey() {
  surveyAnswers = collectAnswers();
  goPage(7);

  // Show summary
  const summary = document.getElementById('resultSummary');
  const total = Object.keys(surveyAnswers).filter(k => !k.startsWith('_')).length;
  summary.innerHTML = `
    <p>✅ <strong>${total} Antworten</strong> erfasst — alles bleibt auf diesem Gerät, kein Upload.</p>
    <p style="margin-top: 0.5rem; color: var(--color-text-faint); font-size: var(--text-xs);">
      Zeitstempel: ${new Date().toLocaleString('de-DE')} · Session-ID: keine (anonym)
    </p>
  `;
  summary.classList.add('visible');
}

// ─── Show detailed results ───────────────────────────────
function showResults() {
  const data = collectAnswers();
  const detail = document.getElementById('resultDetail');

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
    q17: 'Gefühl ohne Internet',
    q18: 'Cybermobbing-Erfahrung',
    q19: 'Social Media → Selbstbild',
    q20: 'Elterngespräche über Internet',
    q21: 'Was mag ich am Internet',
    q22: 'Was nervt mich / ist bedenklich',
    q23: 'Was würde ich ändern',
    q24: 'Gewünschte Unterrichtsthemen',
  };

  const sections = [
    { title: '📱 Allgemeine Nutzung',        keys: ['q1','q2','q3','q4'] },
    { title: '🎵 Social Media & Apps',        keys: ['q5','q6','q7'] },
    { title: '🎮 Gaming',                     keys: ['q8','q9','q10','q11'] },
    { title: '🔒 Datenschutz & Sicherheit',   keys: ['q12','q13','q14','q15','q16'] },
    { title: '💭 Reflexion & Wohlbefinden',   keys: ['q17','q18','q19','q20'] },
    { title: '✍️ Offene Antworten',            keys: ['q21','q22','q23','q24'] },
  ];

  let html = '';
  sections.forEach(sec => {
    const items = sec.keys
      .filter(k => data[k])
      .map(k => {
        const val = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
        return `<div class="result-item"><strong>${questions[k]}:</strong> <span>${escapeHtml(val)}</span></div>`;
      }).join('');

    if (items) {
      html += `
        <div class="result-section">
          <div class="result-section-title">${sec.title}</div>
          ${items}
        </div>`;
    }
  });

  if (!html) {
    html = '<p style="color:var(--color-text-muted)">Noch keine Antworten vorhanden.</p>';
  }

  detail.innerHTML = html;
  detail.style.display = 'block';
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    q17: 'Gefühl ohne Internet',
    q18: 'Cybermobbing-Erfahrung',
    q19: 'Social Media → Selbstbild',
    q20: 'Elterngespräche über Internet',
    q21: 'Was mag ich am Internet',
    q22: 'Was nervt mich / ist bedenklich',
    q23: 'Was würde ich ändern',
    q24: 'Gewünschte Unterrichtsthemen',
  };

  let text = '══════════════════════════════════════════\n';
  text    += '  MeinInternetCheck – Ergebnisse\n';
  text    += '  Klasse 8 · Internetnutzungsverhalten\n';
  text    += '══════════════════════════════════════════\n\n';
  text    += `Exportiert: ${new Date().toLocaleString('de-DE')}\n`;
  text    += 'Hinweis: Vollständig anonym – keine persönlichen Daten\n';
  text    += '(DSGVO-konform, Art. 6 Abs. 1 lit. a)\n\n';

  const sections = [
    { title: 'ALLGEMEINE NUTZUNG',         keys: ['q1','q2','q3','q4'] },
    { title: 'SOCIAL MEDIA & APPS',        keys: ['q5','q6','q7'] },
    { title: 'GAMING',                     keys: ['q8','q9','q10','q11'] },
    { title: 'DATENSCHUTZ & SICHERHEIT',   keys: ['q12','q13','q14','q15','q16'] },
    { title: 'REFLEXION & WOHLBEFINDEN',   keys: ['q17','q18','q19','q20'] },
    { title: 'OFFENE ANTWORTEN',           keys: ['q21','q22','q23','q24'] },
  ];

  sections.forEach(sec => {
    text += `\n── ${sec.title} ──────────────────────────\n`;
    sec.keys.forEach(k => {
      if (!data[k]) return;
      const label = questions[k] || k;
      const val   = Array.isArray(data[k]) ? data[k].join(', ') : data[k];
      text += `\n${label}:\n  → ${val}\n`;
    });
  });

  text += '\n══════════════════════════════════════════\n';

  // Create and trigger download
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `internetcheck-ergebnis-${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Reset ───────────────────────────────────────────────
function resetSurvey() {
  // Clear all inputs
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => {
    if (c.id !== 'consentCheck') c.checked = false;
  });
  document.querySelectorAll('textarea').forEach(ta => ta.value = '');
  document.querySelectorAll('.char-count').forEach(el => el.textContent = '0/500');

  // Reset consent
  const consentCheck = document.getElementById('consentCheck');
  consentCheck.checked = false;
  document.getElementById('startBtn').disabled = true;

  // Reset state
  surveyAnswers = {};

  // Reset result displays
  document.getElementById('resultDetail').style.display = 'none';
  document.getElementById('resultSummary').classList.remove('visible');

  goPage(0);
}

// ─── Utility ─────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Keyboard navigation ─────────────────────────────────
document.addEventListener('keydown', e => {
  // Allow Enter on radio/checkbox cards to select
  if (e.key === 'Enter' && document.activeElement) {
    const el = document.activeElement;
    if (el.closest('.radio-card, .checkbox-card, .app-card')) {
      const input = el.closest('label').querySelector('input');
      if (input) {
        if (input.type === 'radio') input.checked = true;
        if (input.type === 'checkbox') input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }
});

// ─── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Make radio/checkbox cards keyboard accessible
  document.querySelectorAll('.radio-card, .checkbox-card, .app-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'option');
  });

  // Initial progress
  updateProgress(0);
});
