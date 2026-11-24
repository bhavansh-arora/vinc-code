# VINC Code

A gamified coding platform for Classes 3 to 8, starring **Vinc**, the robot built from spare parts.
Students code Vinc through puzzles, teachers track progress and assign class-wise assessments,
schools manage their teachers and sections, and VINC admins run the whole platform.

## Quick start

Requires **Node.js 22.13 or later** (the database uses Node's built-in SQLite, so nothing else to install).

```bash
npm install
npm run seed      # demo school, teachers, students, progress and results
npm run dev       # http://localhost:3000
```

### Demo logins (demo data only)

| Role | Username | Password | What to look at |
|---|---|---|---|
| VINC admin | `admin` | `vinc-demo-admin` | All schools, add a school, assessment bank |
| School admin | `dps-admin` | `demo1234` | Teachers, sections, class-wise summary |
| Teacher | `dps-meerai` | `demo1234` | Sections 3-A and 4-A, results by question |
| Teacher | `dps-rohand` | `demo1234` | Section 6-B |
| Student (Class 3) | `dps-aaravk` | `demo1234` | Dashboard, assessments, the game |
| Student (Class 4) | `dps-reyanshg` | `demo1234` | Has one assessment still to do |
| Student (Class 6) | `dps-tarak` | `demo1234` | |
| Parent | `sunita.gupta` | `demo1234` | Reyansh's progress and results |

Demo codes for trying **Create account** at `/signup`: student joining code `DPS-JOIN`,
teacher joining code `DPS-TCHR`, family code `REYAN4` (Reyansh), School ID `VL-DEMO26`.

`npm run seed -- --reset` deletes the database and creates the demo again.

## Logging in and signing up

`/login` and `/signup` are one page with two tabs, **Log in** and **Create account**.
People log in with a User ID and password. To sign up, they choose who they are:

| Role | Needs | Gets |
|---|---|---|
| Student | The school's **student joining code** (from their teacher), then picks class and section | A **family code** for their parent |
| Teacher | The school's **teacher joining code** (from the coordinator); can pick sections that have no teacher yet | Their sections on the teacher dashboard |
| Parent | Their child's **family code** (on the child's dashboard) | A dashboard with each linked child's progress and results |
| School | A **School ID** issued by VINC (Admin → School IDs; add the school's email and it gets an onboarding email with the ID and a sign-up link) | The school, its coordinator account, and its two joining codes |

Students are never asked for an email address, phone number or date of birth. The User ID is
suggested from the name and checked live; passwords need 8+ characters and show a strength meter.
Code lookups and sign-ups are rate-limited per network. School coordinators can replace a leaked
joining code from their dashboard.

## Who can do what

| | VINC admin | School admin | Teacher | Student |
|---|---|---|---|---|
| Add schools, switch a school off | ✓ | | | |
| Reset a school admin's password | ✓ | | | |
| Add teachers, reset their passwords | | ✓ | | |
| Create sections (Class 3–8) and choose their teacher | | ✓ | | |
| Add students and print login cards | | ✓ (any section) | ✓ (own sections) | |
| Reset a student's password, remove a student | | ✓ | ✓ | |
| Assign assessments, see results, allow a retake | | ✓ | ✓ | |
| See every school's numbers | ✓ | own school | own sections | own work |
| Play the game, take assessments | | | | ✓ |
| Issue School IDs for self-registration | ✓ | | | |
| See and replace joining codes | | ✓ | | |

Every page and every server action checks the signed-in role **and** ownership (a teacher only
reaches their own sections, a school admin only their own school).

## Assessments

`src/data/assessments.ts` holds **12 auto-graded assessments, two per class (Classes 3–8), 96 questions**:

| Class | Topic | Assessments |
|---|---|---|
| 3 | Sequencing and debugging | Checkpoint · End of class |
| 4 | Loops and jump() | Checkpoint · End of class |
| 5 | if / else, conditions | Checkpoint · End of class |
| 6 | Variables in Python | Checkpoint · End of class |
| 7 | Functions | Checkpoint · End of class |
| 8 | Events, lists, AI basics | Checkpoint · End of class |

Classes 3 and 4 include board questions ("Where does Vinc stop?"). Run `npm run check:content`
to prove those answers by running the code on the board, and to check answer positions are spread out.
Answers are graded on the server and never sent to the browser before a student submits.

## Python lessons (Classes 5 to 8)

`src/data/lessons.ts` holds **48 lessons, 12 per class**, each with an explanation, an example, a task,
starter code, hints, a model solution and an automatic check. Students write real Python, run in the
browser by Pyodide (`public/lessons/worker.js`, loaded from cdn.jsdelivr.net), so the server needs no Python.

| Class | Topic | Highlights |
|---|---|---|
| 5 | if / else | Vinc's sensors (`blocked()`, `at_spark()`, `tile()`); one program must solve several boards; wall-follower mazes |
| 6 | Variables | print, maths, `input()`, `while` countdowns, Vinc's step counter, metro fares |
| 7 | Functions | `def`, parameters, `return`, Vinc moves like `stair()` and `walk(n)`, scope |
| 8 | Lists, events, AI | lists, dictionaries, a keyboard-driven Vinc, nearest-neighbour classifier, accuracy, bad data, GreenBin sorter |

Every class has Glitch debug lessons and a boss lesson. `public/lessons/harness.py` runs and checks the code
(boards, expected output, hidden tests, required structures, and a guard that stops endless loops). The
same file is used by `npm run check:lessons` (needs `python3`), which proves every model solution passes and
every starter does not. Students see their own class and earlier ones; teachers see progress per student and
can preview every lesson with its model solution at `/lessons`.

## The game

`game/vinc-game.html` is the stand-alone prototype. `scripts/build-game.mjs` turns it into
`public/game/index.html` for the platform (runs automatically before `dev` and `build`):
progress is saved to the student's account through `/api/progress`, the student's own class
opens first, and the server re-checks stars and spark spending so they cannot be faked.

## Project layout

```
src/app/login, account        sign in, sign out, change password
src/app/admin, school,        role dashboards
        teacher, student
src/app/classes/[id]          a section: students, assessments, add students, passwords
src/app/results/[id]          one assessment's results, student by student and question by question
src/app/assessments           the assessment bank (staff preview with answers)
src/app/api/progress          game progress for students
src/lib/db.ts                 SQLite schema and helpers (the only file that talks to the database)
src/lib/auth.ts               sessions and role checks
src/lib/data.ts               queries used by the dashboards
src/data/assessments.ts       the assessment bank
scripts/                      seed, content checks, game build
```

## Security and privacy

- Passwords are hashed with scrypt. Sessions are random tokens; only their SHA-256 hash is stored.
- Session cookies are `httpOnly`, `SameSite=Lax`, and `Secure` in production. Students are signed
  out after 12 hours (shared school computers), staff after 7 days.
- 5 wrong passwords lock a username for 10 minutes.
- Schools, teachers and school admins get temporary passwords and must choose their own at first sign-in.
- Students have no email address or personal data beyond their name. India's DPDP Act requires
  verifiable parental consent for children's data, so collect consent through the school before go-live.

## Deploying

Production runs in Docker behind Caddy. Step-by-step instructions for code.vinc-lab.com are in
**[deploy/DEPLOY.md](deploy/DEPLOY.md)**. In short:

```bash
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)" > .env   # first admin, created on first start
docker compose up -d --build                             # app on 127.0.0.1:3100
# Caddyfile:  code.vinc-lab.com { reverse_proxy 127.0.0.1:3100 }
```

The data lives in one SQLite file in the `vinc-data` Docker volume, so the app needs a server with a
persistent disk. It will not work on serverless hosting such as Vercel without moving to PostgreSQL
first. All database code lives in `src/lib/db.ts` and `src/lib/data.ts` to make that move easier.

## Not built yet

- Game levels for Classes 5–8 (their students practise on the Class 3–4 levels for now).
- Editing the assessment bank from the admin screen (it is edited in `src/data/assessments.ts`).
- Timed assessments, bulk import of students from a spreadsheet, and parent accounts.
