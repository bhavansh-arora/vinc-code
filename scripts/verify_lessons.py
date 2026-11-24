"""Runs every lesson's model solution and starter code through the student harness. Called by check-lessons.mts."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "public", "lessons"))
import harness  # noqa: E402

lessons = json.load(open(sys.argv[1]))
problems = 0
for l in lessons:
    check = json.dumps(l["check"])
    sol = json.loads(harness.run_lesson(l["solution"], check))
    sta = json.loads(harness.run_lesson(l["starter"], check))
    ok = sol["passed"] and not sta["passed"]
    if not ok:
        problems += 1
        why = []
        if not sol["passed"]:
            why.append("solution FAILS: %s %s" % (sol.get("error"), sol.get("missing")))
            for r in sol.get("runs", []):
                if not r.get("ok", True):
                    why.append("   board %s -> %s" % (r.get("map"), r.get("error")))
        if sta["passed"]:
            why.append("starter already PASSES")
        print("✗ %-6s %-28s %s" % (l["id"], l["title"], "\n      ".join(why)))
    else:
        print("✓ %-6s %-28s starter: %s" % (l["id"], l["title"], (sta.get("error") or ", ".join(sta.get("missing") or []) or "fails")[:70].replace("\n", " ")))
print("%d lessons, %s" % (len(lessons), "all solutions pass and all starters fail" if not problems else "%d problem(s)" % problems))
sys.exit(1 if problems else 0)
