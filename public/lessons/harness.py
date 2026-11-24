"""
VINC Code lesson harness. Runs a student's Python for one lesson and checks it.
Used in the browser (Pyodide, in a Web Worker) and by scripts/verify_lessons.py, so both behave the same.

check kinds:
  vinc    - Vinc must collect every spark on every board in check["maps"] without bumping
  output  - what the program prints must equal check["expected"]
  tests   - check["tests"] (asserts) run after the student's code in the same namespace
Optional: check["require"] = {"uses": ["if", "while", "for", "def", "return", "list", "dict"], "calls": ["print"], "defines": ["hop"]}
          check["inputs"] = values fed to input();  check["expectOutput"] for vinc lessons that must also print something.
          check["events"] = keys passed to on_key(key) for event lessons.
"""
import ast, builtins, io, json, random, sys, traceback, types

MAX_ACTIONS = 400
MAX_LINES = 200_000
FILENAME = "<lesson>"
DIRS = [(-1, 0), (0, 1), (1, 0), (0, -1)]
TILES = {"r": "red", "g": "green", "b": "blue"}


class Bumped(Exception):
    pass


class TooManyMoves(Exception):
    pass


def _user_line():
    f = sys._getframe(1)
    while f is not None and f.f_code.co_filename != FILENAME:
        f = f.f_back
    return f.f_lineno if f is not None else None


class World:
    def __init__(self, rows):
        self.rows = rows
        self.h, self.w = len(rows), len(rows[0])
        self.crates, self.sparks, self.got, self.tiles = set(), set(), set(), {}
        self.trace, self.actions = [], 0
        self.r = self.c = self.d = 0
        for r, row in enumerate(rows):
            for c, ch in enumerate(row):
                if ch == "#":
                    self.crates.add((r, c))
                elif ch == "*":
                    self.sparks.add((r, c))
                elif ch in "^>v<":
                    self.r, self.c, self.d = r, c, "^>v<".index(ch)
                elif ch in TILES:
                    self.tiles[(r, c)] = TILES[ch]

    def _tick(self):
        self.actions += 1
        if self.actions > MAX_ACTIONS:
            raise TooManyMoves("Vinc got tired after %d actions. Is there a loop that never ends?" % MAX_ACTIONS)

    def _log(self, a, line):
        self.trace.append({"a": a, "r": self.r, "c": self.c, "d": self.d, "line": line, "got": len(self.got)})

    def ahead(self, k=1):
        dr, dc = DIRS[self.d]
        return self.r + dr * k, self.c + dc * k

    def free(self, cell):
        r, c = cell
        return 0 <= r < self.h and 0 <= c < self.w and cell not in self.crates

    def move(self, k):
        self._tick()
        line = _user_line()
        cell = self.ahead(k)
        if not self.free(cell):
            self._log("bump", line)
            what = "the edge of the board" if not (0 <= cell[0] < self.h and 0 <= cell[1] < self.w) else "a crate"
            e = Bumped("Vinc %s %s." % ("landed on" if k == 2 and what == "a crate" else "bumped into", what))
            e.line = line
            raise e
        self.r, self.c = cell
        if cell in self.sparks and cell not in self.got:
            self.got.add(cell)
        self._log("jump" if k == 2 else "step", line)

    def turn(self, delta):
        self._tick()
        self.d = (self.d + delta) % 4
        self._log("turn", _user_line())


def _vinc_api(world):
    def step():
        """Move one square forward."""
        world.move(1)

    def jump():
        """Hop over the next square and land on the one after it."""
        world.move(2)

    def turn_left():
        world.turn(3)

    def turn_right():
        world.turn(1)

    def blocked():
        """True if a crate or the edge of the board is right in front of Vinc."""
        return not world.free(world.ahead())

    def at_spark():
        """True if Vinc is standing on a spark square."""
        return (world.r, world.c) in world.sparks

    def crate_ahead():
        """True if a crate (not the edge of the board) is right in front of Vinc."""
        return world.ahead() in world.crates

    def spark_ahead():
        """True if the square in front has a spark that has not been collected."""
        cell = world.ahead()
        return cell in world.sparks and cell not in world.got

    def sparks_left():
        return len(world.sparks - world.got)

    def tile():
        """The colour of the floor under Vinc: 'red', 'green', 'blue' or 'plain'."""
        return world.tiles.get((world.r, world.c), "plain")

    return {f.__name__: f for f in (step, jump, turn_left, turn_right, blocked, crate_ahead, at_spark, spark_ahead, sparks_left, tile)}


def _requirements(tree, req):
    if not req:
        return []
    found = set()
    calls, defs = set(), set()
    for n in ast.walk(tree):
        if isinstance(n, ast.If):
            found.add("if")
            if n.orelse:
                found.add("else")
        elif isinstance(n, ast.While):
            found.add("while")
        elif isinstance(n, (ast.For, ast.comprehension)):
            found.add("for")
        elif isinstance(n, ast.FunctionDef):
            found.add("def")
            defs.add(n.name)
        elif isinstance(n, ast.Return):
            found.add("return")
        elif isinstance(n, (ast.List, ast.ListComp)):
            found.add("list")
        elif isinstance(n, (ast.Dict, ast.DictComp)):
            found.add("dict")
        elif isinstance(n, ast.BoolOp):
            found.add("and" if isinstance(n.op, ast.And) else "or")
        elif isinstance(n, ast.Assign) or isinstance(n, ast.AugAssign):
            found.add("variable")
        elif isinstance(n, ast.Call):
            if isinstance(n.func, ast.Name):
                calls.add(n.func.id)
            elif isinstance(n.func, ast.Attribute):
                calls.add(n.func.attr)
    words = {"if": "an if", "else": "an else", "while": "a while loop", "for": "a for loop", "def": "a function (def)",
             "return": "return", "list": "a list", "dict": "a dictionary", "and": "and", "or": "or", "variable": "a variable"}
    missing = ["Use %s." % words.get(u, u) for u in req.get("uses", []) if u not in found]
    missing += ["Call %s()." % c for c in req.get("calls", []) if c not in calls]
    missing += ["Define a function called %s." % d for d in req.get("defines", []) if d not in defs]
    if "maxLines" in req:
        lines = [l for l in tree_source_lines(tree) if l]
        if len(lines) > req["maxLines"]:
            missing.append("Use %d lines of code or fewer (you have %d)." % (req["maxLines"], len(lines)))
    return missing


_SOURCE = {"text": ""}


def tree_source_lines(_tree):
    return [l for l in (s.strip() for s in _SOURCE["text"].splitlines()) if l and not l.startswith("#")]


def _error_line(exc):
    tb = traceback.extract_tb(exc.__traceback__)
    lines = [f.lineno for f in tb if f.filename == FILENAME]
    return lines[-1] if lines else getattr(exc, "line", None)


def _friendly(exc):
    name = type(exc).__name__
    if isinstance(exc, (Bumped, TooManyMoves)):
        return str(exc)
    if isinstance(exc, NameError):
        return "NameError: %s. Check the spelling, and that you created it before using it." % exc
    if isinstance(exc, IndentationError):
        return "IndentationError: %s." % exc.msg
    if isinstance(exc, AssertionError):
        return str(exc) or "A check did not pass."
    return "%s: %s" % (name, exc)


def _norm(s):
    return "\n".join(l.rstrip() for l in str(s).strip().splitlines())


def _guarded(fn, ns, inputs, out):
    """Run fn() with captured print(), fed input(), and a budget of lines so endless loops stop."""
    feed = list(inputs or [])

    def fake_input(prompt=""):
        value = feed.pop(0) if feed else ""
        out.write(str(prompt) + str(value) + "\n")
        return str(value)

    count = [0]

    def local(frame, event, arg):
        if event == "line":
            count[0] += 1
            if count[0] > MAX_LINES:
                raise TooManyMoves("Your program ran for too long. Is there a loop that never ends?")
        return local

    def tracer(frame, event, arg):
        return local if frame.f_code.co_filename == FILENAME else None

    old_out, old_input = sys.stdout, builtins.input
    sys.stdout, builtins.input = out, fake_input
    if ns is not None:
        ns["input"] = fake_input
    sys.settrace(tracer)
    try:
        fn()
        return None
    except Exception as e:  # noqa: BLE001 - every error is reported to the student
        return e
    finally:
        sys.settrace(None)
        sys.stdout, builtins.input = old_out, old_input


def _exec(code_obj, ns, inputs, out):
    return _guarded(lambda: exec(code_obj, ns), ns, inputs, out)


def run_lesson(code, check_json):
    check = json.loads(check_json)
    _SOURCE["text"] = code
    random.seed(7)
    try:
        tree = ast.parse(code, FILENAME)
    except SyntaxError as e:
        return json.dumps({"passed": False, "stage": "syntax", "error": "SyntaxError: %s." % e.msg, "line": e.lineno, "runs": [], "stdout": ""})
    code_obj = compile(tree, FILENAME, "exec")
    missing = _requirements(tree, check.get("require"))
    kind = check["kind"]
    result = {"passed": False, "missing": missing, "runs": [], "stdout": "", "error": None, "line": None}

    if kind == "vinc":
        all_ok = True
        for idx, rows in enumerate(check["maps"]):
            world = World(rows)
            out = io.StringIO()
            ns = {"__name__": "__main__"}
            ns.update(_vinc_api(world))
            err = _exec(code_obj, ns, check.get("inputs"), out)
            if err is None and check.get("events"):
                handler = ns.get("on_key")
                if not callable(handler):
                    err = NameError("on_key is not defined")
                else:
                    keys = check["events"][idx] if isinstance(check["events"][0], list) else check["events"]
                    err = _guarded(lambda: [handler(k) for k in keys], None, None, out)
            ok = err is None and world.got == world.sparks
            want = check["expectOutputs"][idx] if "expectOutputs" in check else check.get("expectOutput")
            if ok and want is not None and _norm(out.getvalue()) != _norm(want):
                ok = False
                err_msg = "Vinc made it, but the program should print:\n%s" % want
            else:
                err_msg = _friendly(err) if err else (None if ok else "Vinc stopped with %d of %d sparks." % (len(world.got), len(world.sparks)))
            result["runs"].append({"map": rows, "ok": ok, "trace": world.trace, "error": err_msg,
                                   "line": _error_line(err) if err else None, "stdout": out.getvalue(),
                                   "sparks": len(world.got), "total": len(world.sparks)})
            all_ok = all_ok and ok
        first_bad = next((r for r in result["runs"] if not r["ok"]), None)
        if first_bad:
            result["error"], result["line"] = first_bad["error"], first_bad["line"]
        result["stdout"] = result["runs"][0]["stdout"] if result["runs"] else ""
        result["passed"] = all_ok and not missing
        return json.dumps(result)

    if kind == "output" and "cases" in check:
        result["runs"] = []
        for case in check["cases"]:
            out = io.StringIO()
            err = _exec(code_obj, {"__name__": "__main__"}, case.get("inputs"), out)
            ok = err is None and _norm(out.getvalue()) == _norm(case["expected"])
            msg = _friendly(err) if err else (None if ok else "With the answer%s %s, the program should print:\n%s" % (
                "s" if len(case.get("inputs", [])) > 1 else "", ", ".join(map(str, case.get("inputs", []))), case["expected"]))
            result["runs"].append({"ok": ok, "stdout": out.getvalue(), "error": msg, "line": _error_line(err) if err else None})
        bad = next((r for r in result["runs"] if not r["ok"]), None)
        result["stdout"] = (bad or result["runs"][0])["stdout"]
        if bad:
            result["error"], result["line"] = bad["error"], bad["line"]
        result["passed"] = bad is None and not missing
        return json.dumps(result)

    out = io.StringIO()
    ns = {"__name__": "__main__"}
    err = _exec(code_obj, ns, check.get("inputs"), out)
    result["stdout"] = out.getvalue()
    if err is not None:
        result["error"], result["line"] = _friendly(err), _error_line(err)
        return json.dumps(result)
    if kind == "output":
        good = _norm(out.getvalue()) == _norm(check["expected"])
        if not good:
            result["error"] = "Not quite. The program should print:\n%s" % check["expected"]
        result["passed"] = good and not missing
    elif kind == "tests":
        t_out = io.StringIO()
        t_err = _exec(compile(check["tests"], "<checks>", "exec"), ns, None, t_out)
        if t_err is not None:
            result["error"] = _friendly(t_err)
        result["passed"] = t_err is None and not missing
    return json.dumps(result)


def describe_api():
    """Names available in Vinc lessons (shown in the editor's help)."""
    return json.dumps(sorted(_vinc_api(World(["^"])).keys()))
