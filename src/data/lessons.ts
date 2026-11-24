/**
 * Lessons for Classes 5 to 8. Each runs real Python in the browser (Pyodide) through public/lessons/harness.py.
 * Run `npm run check:lessons` to prove every solution passes and every starter does not.
 *
 * Board symbols (Vinc lessons): "." floor, "#" crate, "*" spark, ^ > v < Vinc facing up/right/down/left,
 * r g b coloured floor tiles. Vinc's commands: step() jump() turn_left() turn_right();
 * sensors: blocked() crate_ahead() at_spark() spark_ahead() sparks_left() tile().
 */

export type LessonType = 'Learn' | 'Puzzle' | 'Catch Glitch' | 'Challenge' | 'Boss';
export interface Require { uses?: string[]; calls?: string[]; defines?: string[]; maxLines?: number }
export type Check =
  | { kind: 'vinc'; maps: string[][]; require?: Require; expectOutputs?: string[]; events?: string[] | string[][] }
  | { kind: 'output'; expected?: string; cases?: { inputs?: (string | number)[]; expected: string }[]; inputs?: (string | number)[]; require?: Require }
  | { kind: 'tests'; tests: string; require?: Require };

export interface Lesson {
  id: string; grade: number; n: number; title: string; type: LessonType;
  /** What Vinc (or Glitch, in debug lessons) says to open the lesson. */
  intro: string;
  /** Short explanation. `backticks` become code. */
  explain: string[];
  example?: { code: string; note?: string };
  task: string;
  starter: string;
  hints: string[];
  solution: string;
  check: Check;
}

const L = (grade: number, n: number, l: Omit<Lesson, 'id' | 'grade' | 'n'>): Lesson => ({ id: `${grade}-L${n}`, grade, n, ...l });

export const LESSONS: Lesson[] = [
  /* ============================ Class 5 · if and else ============================ */
  L(5, 1, {
    title: 'Hello, sensor', type: 'Learn',
    intro: 'Beep! I got my Sensor antenna. Now I can tell if something is in front of me!',
    explain: ['`blocked()` asks Vinc a question: is a crate or the edge of the board right in front of me? The answer is `True` or `False`.',
      'An `if` runs the lines under it only when the answer is `True`. Those lines are indented by 4 spaces.'],
    example: { code: 'if blocked():\n    turn_left()\nstep()', note: 'Vinc turns only if something is in the way, then always steps.' },
    task: 'The same program must work on both boards. If Vinc is blocked, turn left first. Then step 3 times to the spark.',
    starter: 'step()\nstep()\nstep()\n',
    hints: ['Put `if blocked():` on the first line.', 'The line under the `if` needs 4 spaces in front: `    turn_left()`'],
    solution: 'if blocked():\n    turn_left()\nstep()\nstep()\nstep()\n',
    check: { kind: 'vinc', maps: [['....', '....', '....', '>..*'], ['*...', '....', '....', '>#..']], require: { uses: ['if'] } }
  }),
  L(5, 2, {
    title: 'Left or right?', type: 'Learn',
    intro: 'I am standing at a crossroads. Which way should I go?',
    explain: ['`else` gives Vinc something to do when the `if` question is `False`.', 'Exactly one of the two parts runs, never both.'],
    example: { code: 'if blocked():\n    turn_right()\nelse:\n    turn_left()' },
    task: 'If the way ahead is blocked, turn right. Otherwise, turn left. Then take 2 steps.',
    starter: 'if blocked():\n    turn_right()\nstep()\nstep()\n',
    hints: ['Add `else:` at the same indent as the `if`.', 'Under `else:`, write `    turn_left()`.'],
    solution: 'if blocked():\n    turn_right()\nelse:\n    turn_left()\nstep()\nstep()\n',
    check: { kind: 'vinc', maps: [['.....', '..#..', '..^.*', '.....'], ['.....', '.....', '*.^..', '.....']], require: { uses: ['if', 'else'] } }
  }),
  L(5, 3, {
    title: 'Repeat until home', type: 'Learn',
    intro: 'The spark is somewhere ahead, but I do not know how far!',
    explain: ['A `while` loop repeats while its question is `True`.', '`at_spark()` is `True` when Vinc stands on a spark. So `while not at_spark():` means "keep going until you reach the spark".'],
    example: { code: 'while not at_spark():\n    step()' },
    task: 'Write one program that reaches the spark on all three boards, whatever the distance.',
    starter: 'step()\nstep()\n',
    hints: ['You do not need to count the steps.', '`while not at_spark():` then `    step()` on the next line.'],
    solution: 'while not at_spark():\n    step()\n',
    check: { kind: 'vinc', maps: [['>.*'], ['>....*'], ['>........*']], require: { uses: ['while'] } }
  }),
  L(5, 4, {
    title: 'Around the corner', type: 'Puzzle',
    intro: 'Sometimes a crate or a wall is in my way. Then I have to turn!',
    explain: ['You can put an `if` inside a `while`. Each time round the loop, Vinc checks its sensor and decides what to do.'],
    task: 'Keep going until you reach the spark. If blocked, turn left. Otherwise, step.',
    starter: 'while not at_spark():\n    step()\n',
    hints: ['Inside the loop: `if blocked():` → `turn_left()`, `else:` → `step()`.', 'Lines inside the `if` need 8 spaces: 4 for the loop and 4 for the `if`.'],
    solution: 'while not at_spark():\n    if blocked():\n        turn_left()\n    else:\n        step()\n',
    check: { kind: 'vinc', maps: [['....*', '.....', '.....', '>....'], ['.*...', '.....', '>.#..'], ['......', '*.....', '>.....']], require: { uses: ['while', 'if'] } }
  }),
  L(5, 5, {
    title: "Glitch swapped the else", type: 'Catch Glitch',
    intro: 'Hee hee! I swapped two lines in Vinc\'s code. Now it turns when it should walk!',
    explain: ['When a program does the opposite of what you want, check which lines are under the `if` and which are under the `else`.'],
    task: 'Find Glitch\'s bug and fix it so Vinc reaches the spark on both boards.',
    starter: 'while not at_spark():\n    if blocked():\n        step()\n    else:\n        turn_left()\n',
    hints: ['What should Vinc do when it is blocked? Turn or step?', 'Swap `step()` and `turn_left()`.'],
    solution: 'while not at_spark():\n    if blocked():\n        turn_left()\n    else:\n        step()\n',
    check: { kind: 'vinc', maps: [['..*', '...', '>..'], ['>..#..', '......', '*.....']], require: { uses: ['while', 'if'] } }
  }),
  L(5, 6, {
    title: 'Hop or step', type: 'Puzzle',
    intro: 'Crates on the road! I can jump over them with my Spring legs.',
    explain: ['`jump()` hops over the next square. Use it when a crate is in the way.'],
    task: 'One program for three roads: jump when blocked, otherwise step, until you reach the spark.',
    starter: 'while not at_spark():\n    step()\n',
    hints: ['Inside the loop, use `if blocked():` → `jump()`, `else:` → `step()`.'],
    solution: 'while not at_spark():\n    if blocked():\n        jump()\n    else:\n        step()\n',
    check: { kind: 'vinc', maps: [['>.#..#.*'], ['>#...#..*'], ['>..#.#*']], require: { uses: ['while', 'if', 'else'] } }
  }),
  L(5, 7, {
    title: 'Colour tiles', type: 'Learn',
    intro: 'The market floor has coloured tiles. They tell me where to turn!',
    explain: ['`tile()` tells you the colour under Vinc: `"red"`, `"blue"` or `"plain"`.', '`==` asks "is this equal?". `elif` means "else, if": it is checked only when the `if` was `False`.'],
    example: { code: 'if tile() == "red":\n    turn_left()\nelif tile() == "blue":\n    turn_right()' },
    task: 'On red, turn left. On blue, turn right. Then always step. Repeat until you reach the spark.',
    starter: 'while not at_spark():\n    step()\n',
    hints: ['Check the tile first, then step, all inside the loop.', 'Use `elif tile() == "blue":` for the second colour.'],
    solution: 'while not at_spark():\n    if tile() == "red":\n        turn_left()\n    elif tile() == "blue":\n        turn_right()\n    step()\n',
    check: { kind: 'vinc', maps: [['......', '...b.*', '......', '......', '>..r..'], ['......', '.*..r.', '......', '>...r.']], require: { uses: ['while', 'if'] } }
  }),
  L(5, 8, {
    title: 'True, False, and, or', type: 'Learn',
    intro: 'My antenna can check two things at once with and, or, not!',
    explain: ['`a and b` is `True` only when both are `True`.', '`a or b` is `True` when at least one is `True`.', '`not a` flips `True` and `False`.'],
    example: { code: 'raining = True\ncold = False\nprint(raining and cold)   # False\nprint(raining or cold)    # True' },
    task: 'Change only the value of `cold` so the program prints True, True, False.',
    starter: 'raining = True\ncold = False\nprint(raining and cold)\nprint(raining or cold)\nprint(not cold)\n',
    hints: ['`raining and cold` is True only if both are True.'],
    solution: 'raining = True\ncold = True\nprint(raining and cold)\nprint(raining or cold)\nprint(not cold)\n',
    check: { kind: 'output', expected: 'True\nTrue\nFalse', require: { calls: ['print'] } }
  }),
  L(5, 9, {
    title: "Glitch's endless loop", type: 'Catch Glitch',
    intro: 'This loop never ends. Vinc will wait forever! Hee hee!',
    explain: ['A `while` loop must change something each time, or its question never changes and it never stops.'],
    task: 'Fix the loop so Vinc turns right when blocked and steps otherwise.',
    starter: 'while not at_spark():\n    if blocked():\n        turn_right()\n',
    hints: ['When Vinc is not blocked, nothing happens. Add an `else`.'],
    solution: 'while not at_spark():\n    if blocked():\n        turn_right()\n    else:\n        step()\n',
    check: { kind: 'vinc', maps: [['>..#..', '......', '..*...'], ['>....', '.....', '....*']], require: { uses: ['while', 'if', 'else'] } }
  }),
  L(5, 10, {
    title: 'Wall follower', type: 'Puzzle',
    intro: 'A maze! There is a trick: keep your right hand on the wall and you will find the way.',
    explain: ['Right-hand rule: at every square, try to turn right. If that way is blocked, turn left until it is free. Then step.', 'A `while` inside a `while` is fine: the inner one keeps turning until the way is clear.'],
    example: { code: 'turn_right()\nwhile blocked():\n    turn_left()\nstep()', note: 'One move of the right-hand rule.' },
    task: 'Repeat the right-hand rule until Vinc reaches the spark. The same code must solve all three mazes.',
    starter: 'while not at_spark():\n    step()\n',
    hints: ['Put the example inside `while not at_spark():`.', 'Indent the inner `while` and its `turn_left()` correctly.'],
    solution: 'while not at_spark():\n    turn_right()\n    while blocked():\n        turn_left()\n    step()\n',
    check: { kind: 'vinc', maps: [['>.....', '#####.', '*.....'], ['>.#*', '#.#.', '#...'], ['>...#', '###.#', '*...#']], require: { uses: ['while'] } }
  }),
  L(5, 11, {
    title: 'Random market', type: 'Challenge',
    intro: 'Every board is different! Only a really smart program works on all four.',
    explain: ['`crate_ahead()` is `True` only for a crate. `blocked()` is also `True` at the edge of the board.', 'So: jump over crates, turn at the edge, otherwise step.'],
    task: 'Write one program that collects the spark on all four boards.',
    starter: 'while not at_spark():\n    step()\n',
    hints: ['Check `crate_ahead()` first, then `blocked()`.', 'Use `if`, `elif` and `else` inside the loop.'],
    solution: 'while not at_spark():\n    if crate_ahead():\n        jump()\n    elif blocked():\n        turn_left()\n    else:\n        step()\n',
    check: { kind: 'vinc', maps: [['....*', '.....', '>.#..'], ['>#.#.*'], ['..*', '...', '...', '>..'], ['...*.', '...#.', '.....', '>....']], require: { uses: ['while', 'if', 'else'] } }
  }),
  L(5, 12, {
    title: 'Boss: Market maze', type: 'Boss',
    intro: 'The night market maze has three sparks. Collect them all to win my Memory chip!',
    explain: ['`sparks_left()` tells you how many sparks are still on the board. Keep going while it is more than 0.'],
    task: 'Use the right-hand rule to collect every spark in both mazes.',
    starter: 'while sparks_left() > 0:\n    step()\n',
    hints: ['Same rule as Wall follower, but loop `while sparks_left() > 0:`.'],
    solution: 'while sparks_left() > 0:\n    turn_right()\n    while blocked():\n        turn_left()\n    step()\n',
    check: { kind: 'vinc', maps: [['>.*...', '#####.', '*...*.'], ['>..*#', '###.#', '*...#']], require: { uses: ['while'] } }
  }),

  /* ============================ Class 6 · Variables in Python ============================ */
  L(6, 1, {
    title: 'Hello, Python', type: 'Learn',
    intro: 'From now on we type real Python, the language used by scientists and game makers!',
    explain: ['`print()` shows text on the screen. Text goes inside quotes: `"like this"`.'],
    example: { code: 'print("Beep boop!")' },
    task: 'Print exactly two lines: Hello, Vinc! and then I can code!',
    starter: 'print("Hello")\n',
    hints: ['Each `print()` makes one line.', 'Check the comma and the exclamation marks.'],
    solution: 'print("Hello, Vinc!")\nprint("I can code!")\n',
    check: { kind: 'output', expected: 'Hello, Vinc!\nI can code!', require: { calls: ['print'] } }
  }),
  L(6, 2, {
    title: 'Boxes called variables', type: 'Learn',
    intro: 'My Memory chip can remember numbers. Each one gets a name.',
    explain: ['A variable is a named box: `sparks = 3` puts 3 in a box called `sparks`.', '`print("Total:", total)` prints the words, a space, then the value.'],
    example: { code: 'fuel = 10\nprint("Fuel:", fuel)' },
    task: 'Make a variable `total` that adds `sparks` and `stars`, then print Total: 8.',
    starter: 'sparks = 3\nstars = 5\n# make total here\n',
    hints: ['`total = sparks + stars`', '`print("Total:", total)`'],
    solution: 'sparks = 3\nstars = 5\ntotal = sparks + stars\nprint("Total:", total)\n',
    check: { kind: 'output', expected: 'Total: 8', require: { uses: ['variable'], calls: ['print'] } }
  }),
  L(6, 3, {
    title: 'Counting with a loop', type: 'Learn',
    intro: 'Every spark I collect, I count. One, two, three!',
    explain: ['`sparks = sparks + 1` takes the old value, adds 1, and stores it back.', '`for i in range(3):` repeats the indented lines 3 times, like the repeat block.'],
    example: { code: 'count = 0\nfor i in range(2):\n    count = count + 1\n    print(count)' },
    task: 'Use a `for` loop to count sparks from 1 to 3, printing each number.',
    starter: 'sparks = 0\nprint(sparks)\n',
    hints: ['Inside the loop: add 1, then print.', 'Both lines in the loop need 4 spaces.'],
    solution: 'sparks = 0\nfor i in range(3):\n    sparks = sparks + 1\n    print(sparks)\n',
    check: { kind: 'output', expected: '1\n2\n3', require: { uses: ['for', 'variable'] } }
  }),
  L(6, 4, {
    title: 'Text and numbers', type: 'Puzzle',
    intro: 'Uh-oh, I tried to add words and numbers together and got confused!',
    explain: ['`"12"` with quotes is text (a string). `12` is a number. You cannot add text and a number with `+`.', 'Use `str(12)` to turn a number into text, or an f-string: `f"{name} has {sparks}"`.'],
    example: { code: 'age = 9\nprint("I am " + str(age))\nprint(f"I am {age}")' },
    task: 'Fix the program so it prints Vinc has 12 sparks.',
    starter: 'name = "Vinc"\nsparks = 12\nprint(name + " has " + sparks + " sparks")\n',
    hints: ['Wrap the number in `str(...)`.', 'Or use `print(f"{name} has {sparks} sparks")`.'],
    solution: 'name = "Vinc"\nsparks = 12\nprint(f"{name} has {sparks} sparks")\n',
    check: { kind: 'output', expected: 'Vinc has 12 sparks' }
  }),
  L(6, 5, {
    title: 'Sharing sparks', type: 'Learn',
    intro: 'I want to share 17 sparks with 5 friends. How many does each get?',
    explain: ['`//` divides and drops the remainder: `17 // 5` is `3`.', '`%` gives the remainder: `17 % 5` is `2`.'],
    task: 'Print how many sparks each friend gets and how many are left over, using `//` and `%`.',
    starter: 'sparks = 17\nfriends = 5\n',
    hints: ['`each = sparks // friends`', '`print("Each friend gets", each)` then `print("Left over:", sparks % friends)`'],
    solution: 'sparks = 17\nfriends = 5\neach = sparks // friends\nprint("Each friend gets", each)\nprint("Left over:", sparks % friends)\n',
    check: { kind: 'output', expected: 'Each friend gets 3\nLeft over: 2', require: { calls: ['print'] } }
  }),
  L(6, 6, {
    title: 'Glitch: wrong start', type: 'Catch Glitch',
    intro: 'I made the counter start at the wrong number. Now the total is wrong! Hee hee!',
    explain: ['Counters usually start at `0`, because nothing has been counted yet.'],
    task: 'Vinc finished 4 levels. Fix the code so it prints 4.',
    starter: 'levels_done = 1\nfor i in range(4):\n    levels_done = levels_done + 1\nprint(levels_done)\n',
    hints: ['What should the counter be before any level is done?'],
    solution: 'levels_done = 0\nfor i in range(4):\n    levels_done = levels_done + 1\nprint(levels_done)\n',
    check: { kind: 'output', expected: '4', require: { uses: ['for'] } }
  }),
  L(6, 7, {
    title: 'Ask a question', type: 'Learn',
    intro: 'Let me get to know you! I will ask you some questions.',
    explain: ['`input("question ")` waits for an answer and gives it back as text.', 'Use `int(...)` to turn an answer into a number so you can do maths with it.'],
    example: { code: 'city = input("Where do you live? ")\nprint("Hello from " + city)' },
    task: 'Ask for a name and an age. Greet the person, then say how old they will be next year.',
    starter: 'name = input("What is your name? ")\n',
    hints: ['`print("Hi " + name + "! I am Vinc.")`', '`age = int(input("How old are you? "))` then `print("Next year you will be", age + 1)`'],
    solution: 'name = input("What is your name? ")\nprint("Hi " + name + "! I am Vinc.")\nage = int(input("How old are you? "))\nprint("Next year you will be", age + 1)\n',
    check: { kind: 'output', cases: [
      { inputs: ['Aarav', 9], expected: 'What is your name? Aarav\nHi Aarav! I am Vinc.\nHow old are you? 9\nNext year you will be 10' },
      { inputs: ['Diya', 11], expected: 'What is your name? Diya\nHi Diya! I am Vinc.\nHow old are you? 11\nNext year you will be 12' }
    ] }
  }),
  L(6, 8, {
    title: 'Ready for launch?', type: 'Learn',
    intro: 'My rocket needs at least 5 litres of fuel. Can you check for me?',
    explain: ['`if` works with numbers too: `>=` means "greater than or equal to".'],
    example: { code: 'score = 7\nif score >= 5:\n    print("Pass")\nelse:\n    print("Try again")' },
    task: 'Ask for the fuel. Print Ready for launch! if it is 5 or more, otherwise Need more fuel.',
    starter: 'fuel = int(input("Fuel? "))\n',
    hints: ['`if fuel >= 5:` … `else:` …'],
    solution: 'fuel = int(input("Fuel? "))\nif fuel >= 5:\n    print("Ready for launch!")\nelse:\n    print("Need more fuel")\n',
    check: { kind: 'output', cases: [{ inputs: [8], expected: 'Fuel? 8\nReady for launch!' }, { inputs: [5], expected: 'Fuel? 5\nReady for launch!' }, { inputs: [2], expected: 'Fuel? 2\nNeed more fuel' }], require: { uses: ['if'] } }
  }),
  L(6, 9, {
    title: 'Countdown', type: 'Learn',
    intro: '3… 2… 1… Lift off! Let us count down with a while loop.',
    explain: ['A `while` loop keeps going while its question is `True`. Change the variable inside the loop so it ends.', '`n = n - 1` makes `n` one smaller.'],
    task: 'Ask where to start, count down to 1, then print Lift off!',
    starter: 'n = int(input("Start from? "))\nprint("Lift off!")\n',
    hints: ['`while n > 0:` then print `n` and make it smaller.'],
    solution: 'n = int(input("Start from? "))\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Lift off!")\n',
    check: { kind: 'output', cases: [{ inputs: [3], expected: 'Start from? 3\n3\n2\n1\nLift off!' }, { inputs: [5], expected: 'Start from? 5\n5\n4\n3\n2\n1\nLift off!' }], require: { uses: ['while'] } }
  }),
  L(6, 10, {
    title: "Vinc's step counter", type: 'Puzzle',
    intro: 'I want to know how many steps I take on each road. Can you count them?',
    explain: ['Variables work in Vinc programs too. Add 1 to a counter every time Vinc steps.'],
    task: 'Walk to the spark, counting steps, then print Steps: and the number. Works on both roads.',
    starter: 'steps = 0\nwhile not at_spark():\n    step()\n',
    hints: ['Inside the loop, after `step()`, add `steps = steps + 1`.', 'After the loop: `print("Steps:", steps)`'],
    solution: 'steps = 0\nwhile not at_spark():\n    step()\n    steps = steps + 1\nprint("Steps:", steps)\n',
    check: { kind: 'vinc', maps: [['>..*'], ['>.....*']], expectOutputs: ['Steps: 3', 'Steps: 6'], require: { uses: ['while', 'variable'] } }
  }),
  L(6, 11, {
    title: 'Glitch typo hunt', type: 'Catch Glitch',
    intro: 'I hid two typos in this program. Python will not even start! Hee hee!',
    explain: ['An `if` line must end with a colon `:`.', 'Every `(` needs a matching `)`. Python tells you the line where it got confused.'],
    task: 'Fix both typos so the program prints Great job! and then Score: 10.',
    starter: 'score = 10\nif score > 5\n    print("Great job!")\nprint("Score: " + str(score)\n',
    hints: ['Look at the end of line 2.', 'Count the brackets on line 4.'],
    solution: 'score = 10\nif score > 5:\n    print("Great job!")\nprint("Score: " + str(score))\n',
    check: { kind: 'output', expected: 'Great job!\nScore: 10' }
  }),
  L(6, 12, {
    title: 'Boss: Metro rush', type: 'Boss',
    intro: 'The metro charges ₹10 for up to 2 stations and ₹5 for every extra station. Win my Gear toolbelt!',
    explain: ['Combine `input`, variables, maths and `if` to work out any fare.'],
    task: 'Ask how many stations, then print the fare, for example Fare: ₹25 for 5 stations.',
    starter: 'stations = int(input("Stations? "))\n',
    hints: ['If `stations <= 2`, the fare is 10.', 'Otherwise it is `10 + (stations - 2) * 5`.', 'Print with `print("Fare: ₹" + str(fare))`.'],
    solution: 'stations = int(input("Stations? "))\nif stations <= 2:\n    fare = 10\nelse:\n    fare = 10 + (stations - 2) * 5\nprint("Fare: ₹" + str(fare))\n',
    check: { kind: 'output', cases: [
      { inputs: [1], expected: 'Stations? 1\nFare: ₹10' }, { inputs: [2], expected: 'Stations? 2\nFare: ₹10' },
      { inputs: [5], expected: 'Stations? 5\nFare: ₹25' }, { inputs: [10], expected: 'Stations? 10\nFare: ₹50' }
    ], require: { uses: ['if'] } }
  }),

  /* ============================ Class 7 · Functions ============================ */
  L(7, 1, {
    title: 'Name a move', type: 'Learn',
    intro: 'With my Gear toolbelt I can learn new moves and give them names!',
    explain: ['`def greet():` creates a function called `greet`. The indented lines are its body.', 'Nothing happens until you call it: `greet()`.'],
    example: { code: 'def cheer():\n    print("Hooray!")\n\ncheer()\ncheer()' },
    task: 'Make a function `greet` that prints Hi, I am Vinc! and call it twice.',
    starter: 'def greet():\n    pass\n',
    hints: ['Replace `pass` with the print line.', 'Call it with `greet()` on two lines at the left edge.'],
    solution: 'def greet():\n    print("Hi, I am Vinc!")\n\ngreet()\ngreet()\n',
    check: { kind: 'output', expected: 'Hi, I am Vinc!\nHi, I am Vinc!', require: { defines: ['greet'], calls: ['greet'] } }
  }),
  L(7, 2, {
    title: 'Your own Vinc move', type: 'Puzzle',
    intro: 'Climbing stairs takes four commands every time. Let us make it one!',
    explain: ['A function can hold Vinc commands too. Then one line does the whole move.'],
    task: 'Define `stair()` (step, turn left, step, turn right) and call it 3 times to collect all the sparks.',
    starter: 'def stair():\n    step()\n',
    hints: ['Add the other three moves inside `stair()`.', 'Call `stair()` three times, or use a `for` loop.'],
    solution: 'def stair():\n    step()\n    turn_left()\n    step()\n    turn_right()\n\nfor i in range(3):\n    stair()\n',
    check: { kind: 'vinc', maps: [['...*', '..*.', '.*..', '>...']], require: { defines: ['stair'] } }
  }),
  L(7, 3, {
    title: 'Parameters', type: 'Learn',
    intro: 'Sometimes I walk 2 squares, sometimes 5. One function can do both!',
    explain: ['A parameter is a value you pass in: in `def walk(n):`, `n` is the number of steps.', '`walk(3)` runs the function with `n` set to 3.'],
    example: { code: 'def shout(word, times):\n    for i in range(times):\n        print(word)\n\nshout("Go!", 2)' },
    task: 'Define `walk(n)` that steps `n` times. Then: walk 3, turn left, walk 2.',
    starter: 'def walk(n):\n    step()\n\nwalk(3)\n',
    hints: ['Inside `walk`, use `for i in range(n):` with `step()` indented under it.', 'Then `turn_left()` and `walk(2)`.'],
    solution: 'def walk(n):\n    for i in range(n):\n        step()\n\nwalk(3)\nturn_left()\nwalk(2)\n',
    check: { kind: 'vinc', maps: [['....', '...*', '....', '>...']], require: { defines: ['walk'], uses: ['for'] } }
  }),
  L(7, 4, {
    title: 'Return values', type: 'Learn',
    intro: 'A function can give an answer back, like a calculator!',
    explain: ['`return` sends a value back to whoever called the function.', '`print` only shows it on the screen. A returned value can be stored and used.'],
    example: { code: 'def add(a, b):\n    return a + b\n\ntotal = add(2, 3)   # total is 5' },
    task: 'Make `double(n)` return the number times 2.',
    starter: 'def double(n):\n    print(n * 2)\n',
    hints: ['Change `print` to `return`.'],
    solution: 'def double(n):\n    return n * 2\n',
    check: { kind: 'tests', tests: 'for n, want in [(3, 6), (0, 0), (-4, -8), (50, 100)]:\n    got = double(n)\n    assert got == want, f"double({n}) should return {want}, but it returned {got}"', require: { defines: ['double'], uses: ['return'] } }
  }),
  L(7, 5, {
    title: 'Glitch: never called', type: 'Catch Glitch',
    intro: 'Vinc knows how to go home, but it is just standing there! Hee hee!',
    explain: ['Defining a function only teaches it. You must call it for it to run.'],
    task: 'Make Vinc use `go_home()` to reach the spark.',
    starter: 'def go_home():\n    while not at_spark():\n        step()\n',
    hints: ['Add `go_home()` at the bottom, with no spaces in front.'],
    solution: 'def go_home():\n    while not at_spark():\n        step()\n\ngo_home()\n',
    check: { kind: 'vinc', maps: [['>...*'], ['>.*']], require: { calls: ['go_home'] } }
  }),
  L(7, 6, {
    title: 'Default values', type: 'Learn',
    intro: 'Most of the time I want 3 stars. Can a function remember that?',
    explain: ['`def stars(n=3):` gives `n` a default. `stars()` uses 3; `stars(1)` uses 1.', '`"★" * 3` repeats text: `"★★★"`.'],
    task: 'Make `stars_text(n=3)` return a string of `n` stars.',
    starter: 'def stars_text(n):\n    return "★"\n',
    hints: ['Change the first line to `def stars_text(n=3):`.', 'Return `"★" * n`.'],
    solution: 'def stars_text(n=3):\n    return "★" * n\n',
    check: { kind: 'tests', tests: 'assert stars_text() == "★★★", "stars_text() should return 3 stars"\nassert stars_text(1) == "★", "stars_text(1) should return 1 star"\nassert stars_text(5) == "★★★★★", "stars_text(5) should return 5 stars"', require: { defines: ['stars_text'] } }
  }),
  L(7, 7, {
    title: 'Functions use functions', type: 'Puzzle',
    intro: 'Big jobs are made of small jobs. Let one function call others!',
    explain: ['Breaking a problem into small functions is called decomposition.'],
    task: 'Finish `area`, `perimeter` and `describe` so describe(3, 4) returns "3x4: area 12, perimeter 14".',
    starter: 'def area(w, h):\n    return 0\n\ndef perimeter(w, h):\n    return 0\n\ndef describe(w, h):\n    return f"{w}x{h}: area {area(w, h)}, perimeter {perimeter(w, h)}"\n',
    hints: ['Area is `w * h`.', 'Perimeter is `2 * (w + h)`.'],
    solution: 'def area(w, h):\n    return w * h\n\ndef perimeter(w, h):\n    return 2 * (w + h)\n\ndef describe(w, h):\n    return f"{w}x{h}: area {area(w, h)}, perimeter {perimeter(w, h)}"\n',
    check: { kind: 'tests', tests: 'assert area(3, 4) == 12, "area(3, 4) should be 12"\nassert perimeter(3, 4) == 14, "perimeter(3, 4) should be 14"\nassert describe(3, 4) == "3x4: area 12, perimeter 14", f"describe(3, 4) returned {describe(3, 4)!r}"\nassert describe(5, 5) == "5x5: area 25, perimeter 20", "describe(5, 5) is not right"', require: { defines: ['area', 'perimeter', 'describe'] } }
  }),
  L(7, 8, {
    title: 'Glitch: wrong order', type: 'Catch Glitch',
    intro: 'I swapped the arguments. Now the shop gives change of minus ₹20! Hee hee!',
    explain: ['Arguments go into parameters in order: the first value goes to the first parameter.'],
    task: 'A ₹30 book paid with a ₹50 note: fix the call so it prints 20.',
    starter: 'def change(paid, price):\n    return paid - price\n\nprint(change(30, 50))\n',
    hints: ['Which number was paid, and which is the price?'],
    solution: 'def change(paid, price):\n    return paid - price\n\nprint(change(50, 30))\n',
    check: { kind: 'output', expected: '20', require: { calls: ['change'] } }
  }),
  L(7, 9, {
    title: 'Pattern printer', type: 'Puzzle',
    intro: 'Let us make sparkly patterns with a function and a loop!',
    explain: ['`range(1, 5)` gives 1, 2, 3, 4.', 'A function with parameters can print a different row each time.'],
    task: 'Define `row(n, ch)` that prints `ch` repeated `n` times. Use a loop to print a triangle of ✦ with 4 rows.',
    starter: 'def row(n, ch):\n    print(ch)\n',
    hints: ['Inside `row`: `print(ch * n)`.', 'Then `for i in range(1, 5):` → `row(i, "✦")`.'],
    solution: 'def row(n, ch):\n    print(ch * n)\n\nfor i in range(1, 5):\n    row(i, "✦")\n',
    check: { kind: 'output', expected: '✦\n✦✦\n✦✦✦\n✦✦✦✦', require: { defines: ['row'], uses: ['for'] } }
  }),
  L(7, 10, {
    title: 'Local or global?', type: 'Learn',
    intro: 'I made tea inside a function, but outside it, the cups have vanished!',
    explain: ['Variables made inside a function are local: they disappear when the function ends.', 'To use a value outside, `return` it.'],
    task: 'Fix the program so it prints Cups: 2.',
    starter: 'def make_tea():\n    cups = 2\n\nmake_tea()\nprint("Cups:", cups)\n',
    hints: ['Add `return cups` inside the function.', 'Then `cups = make_tea()` before printing.'],
    solution: 'def make_tea():\n    cups = 2\n    return cups\n\ncups = make_tea()\nprint("Cups:", cups)\n',
    check: { kind: 'output', expected: 'Cups: 2', require: { uses: ['return'] } }
  }),
  L(7, 11, {
    title: 'Toolbelt remix', type: 'Challenge',
    intro: 'A giant zig-zag board! Write it in as few lines as you can.',
    explain: ['A good function turns a long program into a short one.'],
    task: 'Define `walk(n)` and use it to collect all three sparks. Use 12 lines or fewer.',
    starter: 'def walk(n):\n    for i in range(n):\n        step()\n',
    hints: ['Walk 5, turn left, walk 2, turn left, walk 5, turn right, walk 2, turn right, walk 5.'],
    solution: 'def walk(n):\n    for i in range(n):\n        step()\n\nwalk(5)\nturn_left()\nwalk(2)\nturn_left()\nwalk(5)\nturn_right()\nwalk(2)\nturn_right()\nwalk(5)\n',
    check: { kind: 'vinc', maps: [['......', '.....*', '......', '*.....', '......', '>....*']], require: { defines: ['walk'], maxLines: 12 } }
  }),
  L(7, 12, {
    title: 'Boss: Factory reboot', type: 'Boss',
    intro: 'The factory computer needs three helper functions to restart. Win my AI brain!',
    explain: ['Write each function, then press Run to test them all.'],
    task: 'Write `is_even(n)`, `biggest(a, b, c)` and `count_sparks(text)` (how many * are in the text).',
    starter: 'def is_even(n):\n    return False\n\ndef biggest(a, b, c):\n    return a\n\ndef count_sparks(text):\n    return 0\n',
    hints: ['A number is even if `n % 2 == 0`.', 'Python has `max(a, b, c)`.', 'Loop over each letter of the text and count the `*`, or use `text.count("*")`.'],
    solution: 'def is_even(n):\n    return n % 2 == 0\n\ndef biggest(a, b, c):\n    return max(a, b, c)\n\ndef count_sparks(text):\n    return text.count("*")\n',
    check: { kind: 'tests', tests: 'assert is_even(4) is True and is_even(7) is False and is_even(0) is True, "is_even is not right"\nassert biggest(3, 9, 2) == 9 and biggest(-1, -5, -3) == -1 and biggest(4, 4, 1) == 4, "biggest is not right"\nassert count_sparks("*.*..*") == 3 and count_sparks("....") == 0, "count_sparks is not right"', require: { defines: ['is_even', 'biggest', 'count_sparks'] } }
  }),

  /* ============================ Class 8 · Lists, events and AI ============================ */
  L(8, 1, {
    title: 'Lists', type: 'Learn',
    intro: 'My AI brain needs to remember lots of things. Lists keep them in order!',
    explain: ['A list holds many values: `scores = [4, 7, 1]`.', 'Positions start at 0: `scores[0]` is the first item. `scores[-1]` is the last.'],
    example: { code: 'parts = ["wheels", "antenna"]\nprint(parts[0])   # wheels' },
    task: 'Print the first spark count, then the last one.',
    starter: 'sparks = [4, 7, 1]\n',
    hints: ['`print(sparks[0])`', '`print(sparks[-1])`'],
    solution: 'sparks = [4, 7, 1]\nprint(sparks[0])\nprint(sparks[-1])\n',
    check: { kind: 'output', expected: '4\n1', require: { uses: ['list'] } }
  }),
  L(8, 2, {
    title: 'Loop over a list', type: 'Learn',
    intro: 'I scored three times today. What is my total?',
    explain: ['`for s in scores:` gives you each item in turn.'],
    example: { code: 'for part in ["wheels", "antenna"]:\n    print(part)' },
    task: 'Add up all the scores with a loop and print Total: 23.',
    starter: 'scores = [5, 8, 10]\ntotal = 0\n',
    hints: ['`for s in scores:` → `total = total + s`', 'After the loop: `print("Total:", total)`'],
    solution: 'scores = [5, 8, 10]\ntotal = 0\nfor s in scores:\n    total = total + s\nprint("Total:", total)\n',
    check: { kind: 'output', expected: 'Total: 23', require: { uses: ['for'] } }
  }),
  L(8, 3, {
    title: 'Growing lists', type: 'Learn',
    intro: 'Every time I win a part, I add it to my list!',
    explain: ['`parts.append("wheels")` adds to the end of a list.', '`len(parts)` tells you how many items it has.'],
    task: 'Start with an empty list, append wheels, spring legs and antenna, then print how many parts there are and the last one.',
    starter: 'parts = []\n',
    hints: ['Use `parts.append(...)` three times.', '`print(len(parts))` then `print(parts[-1])`'],
    solution: 'parts = []\nparts.append("wheels")\nparts.append("spring legs")\nparts.append("antenna")\nprint(len(parts))\nprint(parts[-1])\n',
    check: { kind: 'output', expected: '3\nantenna', require: { calls: ['append', 'len'] } }
  }),
  L(8, 4, {
    title: 'Glitch: off by one', type: 'Catch Glitch',
    intro: 'I made the loop start at the wrong place. The first spark is missing! Hee hee!',
    explain: ['`range(len(items))` gives 0, 1, 2… up to the last position. Starting at 1 skips the first item.'],
    task: 'Fix the loop so every spark count is printed.',
    starter: 'sparks = [3, 6, 2, 8]\nfor i in range(1, len(sparks)):\n    print(sparks[i])\n',
    hints: ['Where do list positions start?'],
    solution: 'sparks = [3, 6, 2, 8]\nfor i in range(0, len(sparks)):\n    print(sparks[i])\n',
    check: { kind: 'output', expected: '3\n6\n2\n8', require: { uses: ['for'] } }
  }),
  L(8, 5, {
    title: 'Sorting line', type: 'Puzzle',
    intro: 'Who are the top three in the Spark Cup?',
    explain: ['`sorted(scores, reverse=True)` gives a new list from biggest to smallest.', '`items[:3]` takes the first three.'],
    task: 'Make `top_three(scores)` return the three highest scores, biggest first.',
    starter: 'def top_three(scores):\n    return scores\n',
    hints: ['`return sorted(scores, reverse=True)[:3]`'],
    solution: 'def top_three(scores):\n    return sorted(scores, reverse=True)[:3]\n',
    check: { kind: 'tests', tests: 'assert top_three([5, 9, 1, 7, 3]) == [9, 7, 5], f"top_three([5, 9, 1, 7, 3]) returned {top_three([5, 9, 1, 7, 3])}"\nassert top_three([10, 20, 30]) == [30, 20, 10], "Check the order: biggest first"\nassert top_three([4, 4, 2, 8]) == [8, 4, 4], "Ties should both count"', require: { defines: ['top_three'] } }
  }),
  L(8, 6, {
    title: 'Chatbot Vinc', type: 'Puzzle',
    intro: 'Let us teach me to chat! A dictionary matches what you say to what I answer.',
    explain: ['A dictionary pairs keys with values: `{"hi": "Hello!"}`.', '`replies.get(key, "default")` looks up a key, or gives the default if it is missing.', '`.lower().strip()` makes "  HI " into "hi".'],
    task: 'Finish `reply(message)` so Vinc answers hi, name and bye, and says I do not know that yet. otherwise.',
    starter: 'replies = {"hi": "Hello!"}\n\ndef reply(message):\n    return replies[message]\n',
    hints: ['Add `"name": "I am Vinc."` and `"bye": "See you soon!"` to the dictionary.', 'Use `replies.get(message.lower().strip(), "I do not know that yet.")`'],
    solution: 'replies = {"hi": "Hello!", "name": "I am Vinc.", "bye": "See you soon!"}\n\ndef reply(message):\n    return replies.get(message.lower().strip(), "I do not know that yet.")\n',
    check: { kind: 'tests', tests: 'assert reply("hi") == "Hello!", "reply(\\"hi\\") should be Hello!"\nassert reply("  NAME ") == "I am Vinc.", "Make it work with capitals and spaces"\nassert reply("bye") == "See you soon!", "Add a reply for bye"\nassert reply("pizza?") == "I do not know that yet.", "Unknown messages need the default answer"', require: { defines: ['reply'], uses: ['dict'] } }
  }),
  L(8, 7, {
    title: 'Keyboard driver', type: 'Learn',
    intro: 'Let us drive me with arrow keys! Every key press is an event.',
    explain: ['An event is something that happens, like a key press. A handler is a function that runs when it happens.', 'Here the keys are pressed for you, and each one calls `on_key(key)`.'],
    example: { code: 'def on_key(key):\n    if key == "up":\n        step()' },
    task: 'Make `on_key` step on "up", turn left on "left" and turn right on "right". Both boards must be solved.',
    starter: 'def on_key(key):\n    if key == "up":\n        step()\n',
    hints: ['Add `elif key == "left":` and `elif key == "right":`.'],
    solution: 'def on_key(key):\n    if key == "up":\n        step()\n    elif key == "left":\n        turn_left()\n    elif key == "right":\n        turn_right()\n',
    check: { kind: 'vinc', maps: [['>..*'], ['*...', '....', '>...']], events: [['up', 'up', 'up'], ['left', 'up', 'up', 'right']], require: { defines: ['on_key'] } }
  }),
  L(8, 8, {
    title: 'Teach Vinc colours', type: 'Learn',
    intro: 'I want to tell red from green, like a real AI! You give me examples, and I learn from them.',
    explain: ['Machine learning learns from examples (training data). Each example has a value and a label.', 'A simple method: find the training example closest to the new value, and copy its label. This is called "nearest neighbour".'],
    example: { code: 'abs(240 - 250)   # distance is 10' },
    task: 'Make `classify(redness)` return the label of the closest training example.',
    starter: 'training = [(250, "red"), (230, "red"), (40, "green"), (60, "green")]\n\ndef classify(redness):\n    return "red"\n',
    hints: ['Loop over `for value, label in training:` and keep the one with the smallest `abs(value - redness)`.', 'Start with `best_label = None` and `best_gap = 999`.'],
    solution: 'training = [(250, "red"), (230, "red"), (40, "green"), (60, "green")]\n\ndef classify(redness):\n    best_label = None\n    best_gap = 999\n    for value, label in training:\n        gap = abs(value - redness)\n        if gap < best_gap:\n            best_gap = gap\n            best_label = label\n    return best_label\n',
    check: { kind: 'tests', tests: 'for v, want in [(240, "red"), (50, "green"), (200, "red"), (70, "green"), (130, "green")]:\n    got = classify(v)\n    assert got == want, f"classify({v}) should be {want!r}, but it was {got!r}"', require: { defines: ['classify'], uses: ['for'] } }
  }),
  L(8, 9, {
    title: 'How good is it?', type: 'Puzzle',
    intro: 'My sorter made some guesses. How many did it get right?',
    explain: ['Accuracy = right answers ÷ all answers × 100.', '`zip(a, b)` walks through two lists side by side.'],
    task: 'Make `accuracy(guesses, answers)` return the percentage of guesses that match.',
    starter: 'def accuracy(guesses, answers):\n    return 0\n',
    hints: ['Count matches with `for g, a in zip(guesses, answers):`.', 'Return `right / len(answers) * 100`.'],
    solution: 'def accuracy(guesses, answers):\n    right = 0\n    for g, a in zip(guesses, answers):\n        if g == a:\n            right = right + 1\n    return right / len(answers) * 100\n',
    check: { kind: 'tests', tests: 'assert accuracy(["a", "b"], ["a", "a"]) == 50, "One of two right is 50%"\nassert accuracy(["x"] * 4, ["x"] * 4) == 100, "All right is 100%"\nassert accuracy(["p", "q", "r", "p", "q"], ["p", "q", "p", "p", "r"]) == 60, "Three of five right is 60%"', require: { defines: ['accuracy'] } }
  }),
  L(8, 10, {
    title: 'Glitch poisoned the data', type: 'Catch Glitch',
    intro: 'I swapped some labels in the training data. Now Vinc mixes up red and green! Hee hee!',
    explain: ['An AI is only as good as its data. Wrong labels teach wrong answers.', 'Fix the data. Do not delete examples: the model needs all six.'],
    task: 'Find the two wrong labels in `training` and fix them.',
    starter: 'training = [(250, "red"), (230, "green"), (40, "green"), (60, "red"), (220, "red"), (70, "green")]\n\ndef classify(redness):\n    best_label, best_gap = None, 999\n    for value, label in training:\n        if abs(value - redness) < best_gap:\n            best_gap, best_label = abs(value - redness), label\n    return best_label\n',
    hints: ['High redness should be "red", low should be "green".', 'Look at 230 and 60.'],
    solution: 'training = [(250, "red"), (230, "red"), (40, "green"), (60, "green"), (220, "red"), (70, "green")]\n\ndef classify(redness):\n    best_label, best_gap = None, 999\n    for value, label in training:\n        if abs(value - redness) < best_gap:\n            best_gap, best_label = abs(value - redness), label\n    return best_label\n',
    check: { kind: 'tests', tests: 'assert len(training) == 6, "Keep all six examples. Fix the labels instead of deleting."\nfor v, want in [(235, "red"), (65, "green"), (245, "red"), (45, "green")]:\n    got = classify(v)\n    assert got == want, f"classify({v}) gave {got!r}. Some labels are still wrong."' }
  }),
  L(8, 11, {
    title: 'GreenBin sorter', type: 'Challenge',
    intro: 'Help me sort waste into the right bins, like the GreenBin project at VINC Lab!',
    explain: ['Look for keywords in the item name. `"bottle" in "plastic bottle"` is `True`.', 'Loop over a dictionary with `for bin_name, words in BINS.items():`.'],
    task: 'Make `sort_waste(item)` return "plastic", "paper" or "food", or "ask a teacher" if no keyword matches.',
    starter: 'BINS = {\n    "plastic": ["bottle", "wrapper", "plastic"],\n    "paper": ["newspaper", "box"],\n    "food": ["peel", "rice"],\n}\n\ndef sort_waste(item):\n    return "plastic"\n',
    hints: ['For each bin, check each word: `if word in item.lower():` → return the bin name.', 'After both loops, return "ask a teacher".'],
    solution: 'BINS = {\n    "plastic": ["bottle", "wrapper", "plastic"],\n    "paper": ["newspaper", "box"],\n    "food": ["peel", "rice"],\n}\n\ndef sort_waste(item):\n    for bin_name, words in BINS.items():\n        for word in words:\n            if word in item.lower():\n                return bin_name\n    return "ask a teacher"\n',
    check: { kind: 'tests', tests: 'cases = {"Plastic bottle": "plastic", "banana peel": "food", "old newspaper": "paper", "cardboard box": "paper", "leftover rice": "food", "old shoe": "ask a teacher"}\nfor item, want in cases.items():\n    got = sort_waste(item)\n    assert got == want, f"sort_waste({item!r}) gave {got!r}, should be {want!r}"', require: { defines: ['sort_waste'], uses: ['for'] } }
  }),
  L(8, 12, {
    title: 'Boss: Launch day', type: 'Boss',
    intro: 'The rocket needs all six of my parts. Check the list and launch!',
    explain: ['Combine lists, loops and functions to check what is ready and what is missing.'],
    task: 'Write `missing(parts)` that returns the needed parts not in `parts` (in the order of NEEDED), and `ready(parts)` that returns True when nothing is missing.',
    starter: 'NEEDED = ["wheels", "spring legs", "antenna", "memory chip", "gears", "ai brain"]\n\ndef missing(parts):\n    return []\n\ndef ready(parts):\n    return True\n',
    hints: ['`missing`: loop over NEEDED and collect each part that is `not in parts`.', '`ready`: `return len(missing(parts)) == 0`'],
    solution: 'NEEDED = ["wheels", "spring legs", "antenna", "memory chip", "gears", "ai brain"]\n\ndef missing(parts):\n    result = []\n    for p in NEEDED:\n        if p not in parts:\n            result.append(p)\n    return result\n\ndef ready(parts):\n    return len(missing(parts)) == 0\n',
    check: { kind: 'tests', tests: 'assert missing(["wheels", "gears"]) == ["spring legs", "antenna", "memory chip", "ai brain"], f"missing gave {missing([\'wheels\', \'gears\'])}"\nassert missing(NEEDED) == [], "Nothing is missing when all parts are there"\nassert ready(list(NEEDED)) is True, "ready should be True with all parts"\nassert ready(["wheels"]) is False, "ready should be False when parts are missing"', require: { defines: ['missing', 'ready'] } }
  })
];

export const LESSON_GRADES = [5, 6, 7, 8];
export const lessonById = (id: string) => LESSONS.find(l => l.id === id);
export const lessonsForGrade = (g: number) => LESSONS.filter(l => l.grade === g);
export const LESSON_IDS = new Set(LESSONS.map(l => l.id));
/** The check sent to the browser: everything except the model solution. */
export const publicLesson = (l: Lesson) => { const { solution: _s, ...rest } = l; void _s; return rest; };
