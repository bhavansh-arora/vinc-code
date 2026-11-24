/**
 * Builds public/game/index.html (the Vinc game inside the platform) from game/vinc-game.html
 * (the stand-alone prototype). The app version saves progress to the student's account,
 * unlocks levels by class, and drops the concept-note sections.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let src = fs.readFileSync(path.join(root, 'game/vinc-game.html'), 'utf8');

function replaceOnce(from, to) {
  const i = src.indexOf(from);
  if (i < 0 || src.indexOf(from, i + 1) >= 0) throw new Error('build-game: expected exactly one match for: ' + from.slice(0, 70));
  src = src.slice(0, i) + to + src.slice(i + from.length);
}

// 1. Drop the concept-note sections (everything after the garage, up to the footer).
const cutStart = src.indexOf('  <section>\n    <div class="eyebrow">Why this character</div>');
const cutEnd = src.indexOf('</div>\n<footer>');
if (cutStart < 0 || cutEnd < cutStart) throw new Error('build-game: could not find the concept sections');
src = src.slice(0, cutStart) + src.slice(cutEnd);
src = src.replace(/<footer>.*?<\/footer>/s, '<footer><div class="wrap">VINC Code · Vinc the robot · VINC Learning Centre</div></footer>');
replaceOnce('<title>Meet Vinc</title>', '<title>Play · VINC Code</title>');
replaceOnce('<div class="eyebrow">Mascot concept · VINC Code · Grade 3 and up</div>', '<div class="eyebrow">VINC Code · Play</div>');
replaceOnce('Vinc was put together on the VINC Lab workbench from leftover bits, and a few parts are still missing. Kids write code to guide Vinc through puzzles, and every class they finish gives Vinc a new part. Each part unlocks the next coding idea.',
  'Vinc is missing some parts. Solve the coding puzzles in the workshop below to win them back. Every star you earn gives you 5 sparks to spend in the Garage.');

// 2. Save to the student's account instead of this browser.
replaceOnce("var KEY = 'jodu-proto-v3';", "var KEY = 'jodu-proto-v3', APP = true, APP_INFO = null, saveTimer = null;");
replaceOnce('  var S = load();', '  var S = APP ? defaults() : load();');
replaceOnce('  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }', `  function setSaved(t) { var el = document.getElementById('appSave'); if (el) el.textContent = t; }
  function save() {
    if (!APP) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} return; }
    if (!APP_INFO) return;
    clearTimeout(saveTimer); setSaved('Saving…');
    saveTimer = setTimeout(function () {
      fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ state: S }) })
        .then(function (r) { if (r.status === 401) { setSaved('Signed out: sign in again to save'); return null; } return r.ok ? r.json() : { ok: false }; })
        .then(function (d) { if (d && d.ok) setSaved('All progress saved ✓'); else if (d) setSaved('Could not save. Check your internet.'); })
        .catch(function () { setSaved('Could not save. Check your internet.'); });
    }, 600);
  }`);

// 3. A student's own class is open from the start; earlier classes stay open for practice.
replaceOnce('  function unlocked(i) { return S.unlockAll || i === 0 || S.best[LEVELS[i - 1].id] > 0; }',
  '  function unlocked(i) { return S.unlockAll || i === 0 || S.best[LEVELS[i - 1].id] > 0 || (!!APP_INFO && LEVELS[i].world <= APP_INFO.grade && LEVELS[i - 1].world !== LEVELS[i].world); }');

// 4. Load progress from the server before starting.
replaceOnce(`  applyLook(); updateWallet(); renderSlots(); renderGarage(); setSoundLabel(); setUnlockLabel(); setSpeedLabel();
  loadLevel(S.cur || 0);`, `  function startGame() {
    applyLook(); updateWallet(); renderSlots(); renderGarage(); setSoundLabel(); setUnlockLabel(); setSpeedLabel();
    var first = 0;
    if (APP_INFO && APP_INFO.grade === 4) for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].world === 4) { first = i; break; }
    loadLevel(S.cur || first);
  }
  if (APP) {
    fetch('/api/progress', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d) {
        APP_INFO = d;
        if (d.state) { var base = defaults(); for (var k in base) if (d.state[k] !== undefined) base[k] = d.state[k]; S = base; }
        S.unlockAll = false;
        document.getElementById('appWho').textContent = d.name + ' · Class ' + d.grade + (d.section ? ' · Section ' + d.section : '');
        document.querySelector('.hero h1').textContent = 'Hi ' + String(d.name).split(' ')[0] + '! Ready to help Vinc?';
        setSaved('Progress saves automatically');
      } else setSaved('Preview: sign in as a student to save progress');
      startGame();
    }).catch(function () { setSaved('Offline: progress is not being saved'); startGame(); });
  } else startGame();`);

// 5. Page frame, app bar, and hide the reviewer-only buttons.
const headEnd = src.indexOf('</style>') + '</style>'.length;
const head = src.slice(0, headEnd), body = src.slice(headEnd);
const appCss = `<style>
html, body { margin: 0; }
.appbar { position: sticky; top: 0; z-index: 30; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; padding: 10px max(16px, env(safe-area-inset-right, 0px)) 10px max(16px, env(safe-area-inset-left, 0px)); background: var(--card); border-bottom: 1.5px solid var(--line); font-size: .92rem; }
.appbar a { font-weight: 600; color: var(--ink); }
#appWho { color: var(--ink-2); }
#appSave { margin-left: auto; font-family: var(--mono); font-size: .78rem; color: var(--muted); }
#unlockAll, #resetAll { display: none; }
.hero { padding-block: 20px 36px; }
.hero h1 { font-size: clamp(2rem, 4.6vw, 3.2rem); }
</style>`;
const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
${appCss}
</head>
<body>
<div class="appbar"><a href="/student">← My dashboard</a><span id="appWho"></span><span id="appSave" aria-live="polite"></span></div>
${body}
</body>
</html>
`;
fs.mkdirSync(path.join(root, 'public/game'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/game/index.html'), out);
console.log('build-game: wrote public/game/index.html (' + Math.round(out.length / 1024) + ' KB)');
