"""
Records the game's lines with natural neural voices (Kokoro-82M, Apache-2.0) into public/voice/<key>.mp3.
Only new or changed lines are recorded; files for lines that no longer exist are removed.

  pip install kokoro-onnx soundfile        (plus ffmpeg on the PATH)
  KOKORO_DIR=/path/with/model.onnx+voices.npz python3 scripts/voice-render.py lines.json

model.onnx and voices/*.bin come from huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
(voices.npz is the voice files packed with numpy; see README).
"""
import json, os, subprocess, sys, tempfile
import soundfile as sf
from kokoro_onnx import Kokoro

root = os.path.join(os.path.dirname(__file__), '..', 'public', 'voice')
os.makedirs(root, exist_ok=True)
lines = json.load(open(sys.argv[1]))
kdir = os.environ.get('KOKORO_DIR', '.')
k = Kokoro(os.path.join(kdir, 'model.onnx'), os.path.join(kdir, 'voices.npz'))
keep, made = set(), 0
for i, l in enumerate(lines):
    out = os.path.join(root, l['key'] + '.mp3'); keep.add(l['key'] + '.mp3')
    if os.path.exists(out): continue
    audio, sr = k.create(l['text'], voice=l['voice'], speed=l['speed'], lang=l['lang'])
    with tempfile.NamedTemporaryFile(suffix='.wav') as w:
        sf.write(w.name, audio, sr)
        # mono speech MP3, gently normalised, with a short fade so clips never click
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', w.name, '-af', 'loudnorm=I=-18:TP=-2,afade=t=out:st=%.2f:d=0.08' % max(0, len(audio) / sr - 0.08),
                        '-ac', '1', '-ar', '24000', '-b:a', '40k', out], check=True)
    made += 1
    if made % 25 == 0: print(f'{i + 1}/{len(lines)}', flush=True)
for f in os.listdir(root):
    if f.endswith('.mp3') and f not in keep: os.remove(os.path.join(root, f))
json.dump(sorted(k2[:-4] for k2 in keep), open(os.path.join(root, 'manifest.json'), 'w'))
print(f'{made} new clips, {len(keep)} in total')
