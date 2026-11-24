/* Runs lesson code with Pyodide (real Python in the browser), away from the page so it never freezes.
   The page terminates this worker if a run takes too long. */
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.8/full/';
importScripts(PYODIDE + 'pyodide.js');

const ready = (async () => {
  const py = await loadPyodide({ indexURL: PYODIDE });
  const src = await (await fetch('/lessons/harness.py', { cache: 'no-cache' })).text();
  py.FS.writeFile('/home/pyodide/harness.py', src);
  py.runPython('import sys\nsys.path.insert(0, "/home/pyodide")\nimport harness');
  return py;
})();

ready.then(() => postMessage({ type: 'ready' }), e => postMessage({ type: 'fatal', error: String(e) }));

onmessage = async e => {
  const { id, code, check } = e.data;
  let py;
  try { py = await ready; } catch (err) { postMessage({ type: 'result', id, result: { passed: false, error: 'Python could not start: ' + err, runs: [], stdout: '' } }); return; }
  try {
    py.globals.set('_code', code);
    py.globals.set('_check', JSON.stringify(check));
    const out = py.runPython('harness.run_lesson(_code, _check)');
    postMessage({ type: 'result', id, result: JSON.parse(out) });
  } catch (err) {
    postMessage({ type: 'result', id, result: { passed: false, error: String(err).split('\n').slice(-2).join(' '), runs: [], stdout: '' } });
  }
};
