/**
 * Class-wise assessment bank. Three auto-graded assessments per class (Classes 3 to 8): a checkpoint,
 * an end-of-class test and a practice challenge. Every question is tagged with a skill and a level.
 *
 * Grid questions show a board: columns A–E (left to right), rows 1–5 (top to bottom).
 * Map symbols: "." floor, "#" crate, "*" spark, and Vinc's start as ^ > v < (the way it faces).
 * Code lines use the block language; indent by two spaces inside a repeat.
 * `verify` tells scripts/check-content.ts how to prove the answer by running the code.
 */

export type Verify =
  | { kind: 'end' } // answer option is the cell where Vinc stops (e.g. "D3")
  | { kind: 'sparks'; bumps?: boolean } // answer is the number of sparks collected (bumps: Vinc bumps on purpose)
  | { kind: 'bump' } // answer is the line number where Vinc bumps
  | { kind: 'moves' } // answer is how many step()/jump() blocks actually run
  | { kind: 'wins' }; // exactly the answer option's program collects every spark

export interface Question {
  id: string;
  kind: 'mcq' | 'number';
  prompt: string;
  options?: string[];
  /** mcq: index of the right option. number: the right value. */
  answer: number;
  explain: string;
  map?: string[];
  code?: string[];
  lang?: 'blocks' | 'python';
  verify?: Verify;
  /** The skill this question checks (see SKILLS). */
  skill?: string;
  level?: Level;
}

export type Level = 'Easy' | 'Medium' | 'Hard';
export type AssessmentKind = 'Checkpoint' | 'End of class' | 'Practice challenge';

export interface Assessment {
  id: string;
  grade: number;
  title: string;
  summary: string;
  minutes: number;
  questions: Question[];
  kind?: AssessmentKind;
  /** What a student who passes can do. */
  objectives?: string[];
}

/** The skills each class's questions are tagged with, in teaching order. */
export const SKILLS: Record<number, string[]> = {
  3: ['Algorithms', 'Directions and turns', 'Tracing code', 'Debugging', 'Writing programs'],
  4: ['Loops', 'Tracing loops', 'Nested loops', 'Patterns', 'Jump', 'Debugging loops'],
  5: ['Conditions', 'If and else', 'Boolean logic', 'Loops with conditions', 'Debugging', 'Problem solving'],
  6: ['Variables', 'Arithmetic', 'Text and input', 'Loops', 'Debugging'],
  7: ['Functions', 'Parameters and return', 'Scope', 'Decomposition', 'Geometry with code'],
  8: ['Events', 'Lists', 'Loops over lists', 'AI and data', 'Responsible AI']
};

/** Questions as written: the right option is usually listed first. They are shuffled below. */
const WRITTEN: Assessment[] = [
  /* ------------------------------ Class 3 ------------------------------ */
  {
    id: 'c3-a', grade: 3, minutes: 20,
    title: 'Checkpoint: Giving Vinc instructions',
    summary: 'Algorithms, directions, turning and counting steps.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'What is an algorithm?',
        options: ['A list of steps to finish a task', 'A kind of computer', "A robot's battery", 'A score in a game'], answer: 0,
        explain: 'An algorithm is a list of steps, in order, that finishes a task. A recipe is an algorithm too!' },
      { id: 'q2', kind: 'mcq', prompt: 'Where does Vinc stop?',
        map: ['.....', '.....', '>....', '.....', '.....'], code: ['step()', 'step()', 'step()'],
        options: ['C3', 'D3', 'E3', 'D2'], answer: 1, verify: { kind: 'end' },
        explain: 'Vinc starts at A3 facing right. Three steps go to B3, C3 and then D3.' },
      { id: 'q3', kind: 'mcq', prompt: 'Vinc is facing up. Which block makes Vinc face left?',
        options: ['turnLeft()', 'turnRight()', 'step()', 'jump()'], answer: 0,
        explain: 'From facing up, a left turn makes Vinc face left.' },
      { id: 'q4', kind: 'number', prompt: 'Vinc is facing right. How many turnRight() blocks does it need to face left?', answer: 2,
        explain: 'Right → down → left. That is two right turns, which is a U-turn.' },
      { id: 'q5', kind: 'number', prompt: 'How many sparks does Vinc collect?',
        map: ['.....', '.....', '>*.**', '.....', '.....'], code: ['step()', 'step()', 'step()'], answer: 2, verify: { kind: 'sparks' },
        explain: 'Vinc passes B3 (spark) and C3 (empty), then stops on D3 (spark). The spark on E3 is never reached.' },
      { id: 'q6', kind: 'mcq', prompt: 'Does turnLeft() move Vinc to a new square?',
        options: ['No, Vinc only turns on the spot', 'Yes, one square to the left', 'Yes, two squares', 'Only on big boards'], answer: 0,
        explain: 'Turning changes the way Vinc faces. Only step() and jump() move Vinc.' },
      { id: 'q7', kind: 'number', prompt: 'Vinc bumps into a crate. On which line does it happen?',
        map: ['.....', '.....', '>.#..', '.....', '.....'], code: ['step()', 'step()', 'turnLeft()', 'step()'], answer: 2, verify: { kind: 'bump' },
        explain: 'Line 1 moves Vinc to B3. Line 2 tries to move onto C3, but there is a crate there.' },
      { id: 'q8', kind: 'mcq', prompt: 'Which program collects the spark?',
        map: ['.....', '..*..', '.....', '.....', '..^..'],
        options: ['step(), step(), step()', 'turnLeft(), step(), step(), step()', 'step(), step(), turnRight(), step()', 'turnRight(), step(), step(), step()'],
        answer: 0, verify: { kind: 'wins' },
        explain: 'Vinc already faces up, and the spark is three squares straight ahead.' }
    ]
  },
  {
    id: 'c3-b', grade: 3, minutes: 25,
    title: 'End of Class 3: Sequencing and debugging',
    summary: 'Order of steps, predicting moves, finding bugs and writing short programs.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'Which order is right for brushing your teeth?',
        options: ['Put paste on brush → brush → rinse', 'Rinse → brush → put paste on brush', 'Brush → put paste on brush → rinse', 'Rinse → put paste on brush → rinse'], answer: 0,
        explain: 'Order matters in real life and in code. Doing the right steps in the wrong order gives the wrong result.' },
      { id: 'q2', kind: 'mcq', prompt: 'Where does Vinc stop?',
        map: ['.....', '.....', '.....', '.....', '>....'], code: ['step()', 'step()', 'turnLeft()', 'step()', 'step()', 'step()'],
        options: ['C1', 'C2', 'B2', 'C3'], answer: 1, verify: { kind: 'end' },
        explain: 'Two steps right reach C5. After turning left Vinc faces up, and three steps reach C2.' },
      { id: 'q3', kind: 'mcq', prompt: 'What is a bug?',
        options: ['A mistake in a program', 'A very fast program', 'A kind of robot', 'The end of a game'], answer: 0,
        explain: 'A bug is a mistake that makes a program do the wrong thing. Fixing it is called debugging.' },
      { id: 'q4', kind: 'number', prompt: 'On which line does Vinc go off the board?',
        map: ['.....', '.....', '...>.', '.....', '.....'], code: ['step()', 'step()', 'turnLeft()', 'step()'], answer: 2, verify: { kind: 'bump' },
        explain: 'Vinc starts at D3. Line 1 reaches E3, the last square. Line 2 tries to step past the edge.' },
      { id: 'q5', kind: 'number', prompt: 'How many sparks does Vinc collect?',
        map: ['..*..', '..*..', '.....', '..*..', '..^..'], code: ['step()', 'step()', 'step()', 'turnRight()', 'step()'], answer: 2, verify: { kind: 'sparks' },
        explain: 'Going up, Vinc collects C4 and C2, then turns right and steps to D2. The spark at C1 is missed.' },
      { id: 'q6', kind: 'mcq', prompt: 'Which program collects the spark?',
        map: ['.....', '.....', '>.#.*', '.....', '.....'],
        options: ['step(), step(), step(), step()', 'step(), turnLeft(), step(), turnRight(), step(), step(), turnRight(), step(), turnLeft(), step()', 'turnLeft(), step(), step(), step(), step()', 'step(), turnRight(), step(), turnLeft(), step()'],
        answer: 1, verify: { kind: 'wins' },
        explain: 'The crate blocks the straight road, so Vinc must go up a row, past the crate, and come back down.' },
      { id: 'q7', kind: 'mcq', prompt: 'A program has the right blocks but in the wrong order. What will happen?',
        options: ['The robot may do the wrong thing', 'The robot always fixes the order', 'Nothing will happen', 'The program runs faster'], answer: 0,
        explain: 'Robots follow instructions exactly, in the order given. They cannot guess what you meant.' },
      { id: 'q8', kind: 'number', prompt: 'Vinc is facing right. How many blocks are needed, at the fewest, to reach a spark 2 squares up?', answer: 3,
        explain: 'turnLeft(), step(), step(). One turn plus two steps is 3 blocks.' }
    ]
  },

  /* ------------------------------ Class 4 ------------------------------ */
  {
    id: 'c4-a', grade: 4, minutes: 20,
    title: 'Checkpoint: Loops',
    summary: 'repeat blocks, counting how many times code runs, and jump().',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'How many step() blocks run?',
        code: ['repeat 3:', '  step()', '  step()'], answer: 6, verify: { kind: 'moves' },
        explain: 'The loop body has 2 steps and runs 3 times: 2 × 3 = 6.' },
      { id: 'q2', kind: 'mcq', prompt: 'Which program does the same as step() step() step() step() step()?',
        options: ['repeat 5: step()', 'repeat 4: step()', 'repeat 5: turnLeft()', 'step() repeat 5'], answer: 0,
        explain: 'repeat 5 runs the step() inside it five times.' },
      { id: 'q3', kind: 'mcq', prompt: 'Where does Vinc stop?',
        map: ['.....', '.....', '.....', '.....', '^....'], code: ['repeat 4:', '  step()', 'turnRight()', 'repeat 2:', '  step()'],
        options: ['C1', 'B1', 'A1', 'C2'], answer: 0, verify: { kind: 'end' },
        explain: 'Four steps up reach A1. After turning right, two steps reach C1.' },
      { id: 'q4', kind: 'number', prompt: 'How many step() blocks run?',
        code: ['repeat 2:', '  repeat 3:', '    step()', '  turnRight()'], answer: 6, verify: { kind: 'moves' },
        explain: 'The inner loop runs 3 steps. The outer loop runs it 2 times: 3 × 2 = 6.' },
      { id: 'q5', kind: 'mcq', prompt: 'Why do programmers use loops?',
        options: ['To make long programs shorter and easier to read', 'To make the robot slower', 'To add bugs', 'Loops are only for games'], answer: 0,
        explain: 'Loops repeat a pattern without copying the same blocks again and again.' },
      { id: 'q6', kind: 'number', prompt: 'How many squares does jump() move Vinc forward?', answer: 2,
        explain: 'jump() hops over one square and lands on the square after it.' },
      { id: 'q7', kind: 'number', prompt: 'How many sparks does Vinc collect?',
        map: ['.....', '.....', '>#*#*', '.....', '.....'], code: ['repeat 2:', '  jump()'], answer: 2, verify: { kind: 'sparks' },
        explain: 'Each jump clears a crate and lands on a spark: C3, then E3.' },
      { id: 'q8', kind: 'number', prompt: 'Vinc bumps into a crate. On which line does it happen?',
        map: ['.....', '.....', '>.#..', '.....', '.....'], code: ['repeat 3:', '  step()'], answer: 2, verify: { kind: 'bump' },
        explain: 'The first step reaches B3. The second time line 2 runs, C3 has a crate. A jump() would have cleared it.' }
    ]
  },
  {
    id: 'c4-b', grade: 4, minutes: 25,
    title: 'End of Class 4: Patterns and loops',
    summary: 'Finding patterns, nested loops, fixing loop bugs and choosing between step and jump.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'Which pattern repeats in step, turnLeft, step, turnRight, step, turnLeft, step, turnRight?',
        options: ['step, turnLeft, step, turnRight', 'step, step', 'turnLeft, turnRight', 'step, turnLeft'], answer: 0,
        explain: 'The four blocks step, turnLeft, step, turnRight appear twice. That makes it a staircase.' },
      { id: 'q2', kind: 'number', prompt: 'How many sparks does Vinc collect?',
        map: ['....*', '...*.', '..*..', '.*...', '>....'], code: ['repeat 3:', '  step()', '  turnLeft()', '  step()', '  turnRight()'], answer: 3, verify: { kind: 'sparks' },
        explain: 'Each loop climbs one stair and lands on a spark. Three loops collect three sparks. The top spark needs a fourth loop.' },
      { id: 'q3', kind: 'number', prompt: 'How many step() blocks run?',
        code: ['repeat 4:', '  repeat 4:', '    step()', '  turnRight()'], answer: 16, verify: { kind: 'moves' },
        explain: '4 steps per side, 4 sides: 4 × 4 = 16. This program drives a square.' },
      { id: 'q4', kind: 'mcq', prompt: 'Where does Vinc stop?',
        map: ['.....', '.....', '.....', '.....', '^....'], code: ['repeat 2:', '  step()', '  step()', '  turnRight()'],
        options: ['C3', 'A3', 'C2', 'B3'], answer: 0, verify: { kind: 'end' },
        explain: 'Two steps up reach A3, then Vinc turns right. Two more steps reach C3, then it turns again but does not move.' },
      { id: 'q5', kind: 'mcq', prompt: 'Which program collects both sparks?',
        map: ['.....', '.....', '>#*#*', '.....', '.....'],
        options: ['jump(), jump()', 'step(), step(), step(), step()', 'jump(), step(), step()', 'step(), jump()'], answer: 0, verify: { kind: 'wins' },
        explain: 'Crates sit on B3 and D3. Only jumping clears both.' },
      { id: 'q6', kind: 'mcq', prompt: 'A loop should collect 4 stairs of sparks but Vinc stops after 3. What is most likely the bug?',
        options: ['The repeat number is 3 instead of 4', 'step() is spelled wrong', 'Vinc needs a hat', 'The board is too big'], answer: 0,
        explain: 'When a loop stops early, check the repeat number first.' },
      { id: 'q7', kind: 'number', prompt: 'A program has 14 blocks: the same 2 blocks written 7 times. Using one repeat block, how many blocks will it have? (Count the repeat block too.)', answer: 3,
        explain: 'repeat 7 plus the 2 blocks inside it: 3 blocks instead of 14.' },
      { id: 'q8', kind: 'mcq', prompt: 'Vinc faces a crate with an empty square behind it. Which block gets Vinc past it?',
        options: ['jump()', 'step()', 'turnLeft()', 'repeat 2: step()'], answer: 0,
        explain: 'step() bumps into the crate. jump() hops over it.' }
    ]
  },

  /* ------------------------------ Class 5 ------------------------------ */
  {
    id: 'c5-a', grade: 5, minutes: 20,
    title: 'Checkpoint: if and else',
    summary: 'Conditions, True and False, sensors and choosing what to do.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'What can a condition be?',
        options: ['Only True or False', 'Any number', 'A colour', 'A list of steps'], answer: 0,
        explain: 'A condition is a question with a yes/no answer: True or False.' },
      { id: 'q2', kind: 'mcq', prompt: 'Vinc is NOT blocked. What does this code do?', code: ['if blocked():', '  turnRight()', 'else:', '  step()'],
        options: ['Vinc steps forward', 'Vinc turns right', 'Vinc does both', 'Nothing happens'], answer: 0,
        explain: 'blocked() is False, so the else part runs.' },
      { id: 'q3', kind: 'mcq', prompt: 'x = 7. Is x > 5 and x < 10?', options: ['True', 'False'], answer: 0,
        explain: '7 is more than 5 and less than 10. Both parts are True, so and gives True.' },
      { id: 'q4', kind: 'mcq', prompt: 'When is "A or B" True?', options: ['When at least one of A and B is True', 'Only when both are True', 'Only when both are False', 'Never'], answer: 0,
        explain: 'or needs just one True part.' },
      { id: 'q5', kind: 'mcq', prompt: 'What is not True?', options: ['False', 'True', '0.5', 'Nothing'], answer: 0,
        explain: 'not flips a condition: not True is False.' },
      { id: 'q6', kind: 'mcq', prompt: 'The light is "green". What does Vinc do?', code: ['if light == "red":', '  wait()', 'else:', '  step()'],
        options: ['step()', 'wait()', 'Both', 'Neither'], answer: 0,
        explain: '"green" is not "red", so the condition is False and else runs.' },
      { id: 'q7', kind: 'mcq', prompt: 'Which sensor question can Vinc ask with its antenna?', options: ['Is there a crate in front of me?', 'What is 2 + 2?', 'What is my name?', 'Which hat do I like?'], answer: 0,
        explain: 'Sensors measure the world. blocked() asks whether something is in front of Vinc.' },
      { id: 'q8', kind: 'mcq', prompt: 'Why use if/else instead of a fixed list of steps?', options: ['So one program can handle different boards', 'To make programs longer', 'Because loops are not allowed', 'To slow the robot down'], answer: 0,
        explain: 'Conditions let a program decide, so it works even when the board changes.' }
    ]
  },
  {
    id: 'c5-b', grade: 5, minutes: 25,
    title: 'End of Class 5: Smart decisions',
    summary: 'repeat until, combining conditions, and debugging endless loops.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'When does this loop stop?', code: ['repeat until atSpark():', '  step()'],
        options: ['When Vinc reaches the spark', 'After 10 steps', 'Never', 'Before it starts'], answer: 0,
        explain: 'repeat until keeps going until its condition becomes True.' },
      { id: 'q2', kind: 'mcq', prompt: 'What is the bug in this program?', code: ['repeat until atSpark():', '  turnLeft()'],
        options: ['Vinc never moves, so the loop never ends', 'turnLeft() is spelled wrong', 'There is no bug', 'The loop ends too soon'], answer: 0,
        explain: 'Vinc spins on the spot forever. An endless loop is a common bug.' },
      { id: 'q3', kind: 'mcq', prompt: 'sparks = 4. Which is True?', options: ['sparks > 3 and sparks < 5', 'sparks > 5', 'sparks == 3', 'sparks < 2 or sparks > 9'], answer: 0,
        explain: '4 is greater than 3 and less than 5.' },
      { id: 'q4', kind: 'mcq', prompt: 'A maze changes every time. Which idea solves any simple maze?',
        options: ['Keep one hand on the wall: if the right side is open, turn right; otherwise go straight or turn left', 'Always step 5 times', 'Always turn left', 'Stop at the start'], answer: 0,
        explain: 'The wall-follower uses conditions at every step, so it adapts to the maze.' },
      { id: 'q5', kind: 'mcq', prompt: 'It is raining and cold. Which rule tells you to wear a raincoat AND a sweater?',
        options: ['if raining and cold', 'if raining or cold', 'if not raining', 'if sunny'], answer: 0,
        explain: 'You need both conditions to be True, so use and.' },
      { id: 'q6', kind: 'mcq', prompt: 'The tile is "blue". What does Vinc do?', code: ['if tile == "red":', '  jump()', 'elif tile == "blue":', '  turnLeft()', 'else:', '  step()'],
        options: ['turnLeft()', 'jump()', 'step()', 'jump() and turnLeft()'], answer: 0,
        explain: 'The first condition is False. The elif condition is True, so turnLeft() runs and the rest is skipped.' },
      { id: 'q7', kind: 'mcq', prompt: 'Which is the best test for a program that must work on random boards?',
        options: ['Run it on many different boards', 'Run it once', 'Never run it', 'Only test the easiest board'], answer: 0,
        explain: 'Testing many cases finds bugs that one lucky run would hide.' },
      { id: 'q8', kind: 'number', prompt: 'A line-following robot checks its sensor 10 times every second. How many checks does it make in 6 seconds?', answer: 60,
        explain: '10 checks × 6 seconds = 60. Robots check sensors over and over inside a loop.' }
    ]
  },

  /* ------------------------------ Class 6 ------------------------------ */
  {
    id: 'c6-a', grade: 6, minutes: 25,
    title: 'Checkpoint: Variables in Python',
    summary: 'Storing values, updating them, and simple Python arithmetic.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['sparks = 3', 'sparks = sparks + 2', 'print(sparks)'], answer: 5,
        explain: 'sparks starts at 3. Adding 2 stores 5.' },
      { id: 'q2', kind: 'number', prompt: 'What is x at the end?', lang: 'python', code: ['x = 10', 'x = x - 4', 'x = x * 2'], answer: 12,
        explain: '10 − 4 = 6, then 6 × 2 = 12.' },
      { id: 'q3', kind: 'mcq', prompt: 'What does this print?', lang: 'python', code: ['name = "Vinc"', 'print("Hi " + name)'],
        options: ['Hi Vinc', 'Hi name', '"Hi " + name', 'Error'], answer: 0,
        explain: 'The value of name, "Vinc", is joined to "Hi ".' },
      { id: 'q4', kind: 'mcq', prompt: 'What does print("5" + "5") show?', options: ['55', '10', '5 + 5', 'Error'], answer: 0,
        explain: '"5" in quotes is text. Adding text joins it together.' },
      { id: 'q5', kind: 'number', prompt: 'What does print(7 // 2) show?', answer: 3,
        explain: '// divides and drops the remainder: 7 ÷ 2 = 3 remainder 1.' },
      { id: 'q6', kind: 'number', prompt: 'What does print(7 % 2) show?', answer: 1,
        explain: '% gives the remainder: 7 ÷ 2 = 3 remainder 1.' },
      { id: 'q7', kind: 'mcq', prompt: 'Which is a valid Python variable name?', options: ['spark_count', '2sparks', 'spark count', 'class'], answer: 0,
        explain: 'Names cannot start with a digit, contain spaces, or be Python keywords like class.' },
      { id: 'q8', kind: 'mcq', prompt: 'What type of value does input() give back?', options: ['Text (a string)', 'A whole number', 'True or False', 'A list'], answer: 0,
        explain: 'input() always returns text. Use int() to turn it into a number.' }
    ]
  },
  {
    id: 'c6-b', grade: 6, minutes: 30,
    title: 'End of Class 6: Variables, loops and bugs',
    summary: 'while loops, counters, totals and fixing Python errors.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'How many lines does this print?', lang: 'python', code: ['n = 3', 'while n > 0:', '    print(n)', '    n = n - 1'], answer: 3,
        explain: 'It prints 3, 2 and 1. When n becomes 0, n > 0 is False and the loop stops.' },
      { id: 'q2', kind: 'number', prompt: 'What is fuel at the end?', lang: 'python', code: ['fuel = 10', 'for i in range(4):', '    fuel = fuel - 2'], answer: 2,
        explain: 'The loop runs 4 times, using 2 each time: 10 − 8 = 2.' },
      { id: 'q3', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['count = 0', 'for i in range(5):', '    count = count + i', 'print(count)'], answer: 10,
        explain: 'range(5) gives 0, 1, 2, 3, 4. Their total is 10.' },
      { id: 'q4', kind: 'number', prompt: 'Which line has the bug?', lang: 'python', code: ['speed = 4', 'if speed > 3', '    print("Fast!")'], answer: 2,
        explain: 'Line 2 needs a colon at the end: if speed > 3:' },
      { id: 'q5', kind: 'mcq', prompt: 'What is wrong with this counter?', lang: 'python', code: ['stars = 1', 'for level in range(3):', '    stars = stars + 1', 'print(stars)  # should be 3'],
        options: ['stars should start at 0', 'range(3) should be range(4)', 'print is wrong', 'Nothing'], answer: 0,
        explain: 'Starting at 1 gives 4. Counters usually start at 0.' },
      { id: 'q6', kind: 'mcq', prompt: 'A ticket costs ₹15. Which line stores the cost of 4 tickets?', options: ['total = 15 * 4', 'total = "15 * 4"', '15 * 4 = total', 'total == 15 * 4'], answer: 0,
        explain: 'A single = stores a value. The name goes on the left.' },
      { id: 'q7', kind: 'mcq', prompt: 'What does int("42") + 8 give?', options: ['50', '428', '"50"', 'Error'], answer: 0,
        explain: 'int() turns the text "42" into the number 42, and 42 + 8 = 50.' },
      { id: 'q8', kind: 'mcq', prompt: 'Which loop is best when you do NOT know how many times to repeat?', options: ['while', 'for i in range(5)', 'print', 'if'], answer: 0,
        explain: 'while keeps going until its condition is False, such as "while fuel > 0".' }
    ]
  },

  /* ------------------------------ Class 7 ------------------------------ */
  {
    id: 'c7-a', grade: 7, minutes: 25,
    title: 'Checkpoint: Functions',
    summary: 'Defining and calling functions, parameters and return values.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'What does this program print?', lang: 'python', code: ['def greet():', '    print("Hi")'],
        options: ['Nothing, because greet() is never called', 'Hi', 'greet', 'Error'], answer: 0,
        explain: 'def only creates the function. It runs when you call greet().' },
      { id: 'q2', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['def double(n):', '    return n * 2', 'print(double(3))'], answer: 6,
        explain: 'n is 3, so the function returns 6.' },
      { id: 'q3', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['def area(w, h):', '    return w * h', 'print(area(3, 4))'], answer: 12,
        explain: 'w = 3 and h = 4, so 3 × 4 = 12.' },
      { id: 'q4', kind: 'number', prompt: 'What is x?', lang: 'python', code: ['def add(a, b):', '    return a + b', 'x = add(2, add(3, 4))'], answer: 9,
        explain: 'The inner call add(3, 4) gives 7. Then add(2, 7) gives 9.' },
      { id: 'q5', kind: 'mcq', prompt: 'What is a parameter?', options: ['A value a function receives when it is called', 'The name of a file', 'A kind of loop', 'An error message'], answer: 0,
        explain: 'In def hop(n): the parameter n receives the value you pass in.' },
      { id: 'q6', kind: 'mcq', prompt: 'Why do programmers write functions?', options: ['To reuse code and break big problems into small parts', 'To make code longer', 'To hide bugs', 'Because Python requires it'], answer: 0,
        explain: 'Functions let you name a job once and use it many times.' },
      { id: 'q7', kind: 'mcq', prompt: 'What is the difference between return and print?', options: ['return gives a value back to the code; print shows it on screen', 'They are the same', 'print gives a value back; return shows it', 'return stops Python'], answer: 0,
        explain: 'A returned value can be stored and used in more calculations.' },
      { id: 'q8', kind: 'number', prompt: 'Vinc draws a regular shape with a pen. How many degrees should it turn at each corner of a square?', answer: 90,
        explain: 'A full turn is 360°. Divided by 4 corners: 90°.' }
    ]
  },
  {
    id: 'c7-b', grade: 7, minutes: 30,
    title: 'End of Class 7: Building with functions',
    summary: 'Decomposition, scope, debugging calls and drawing with functions.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'How many degrees should Vinc turn at each corner of a regular hexagon (6 sides)?', answer: 60,
        explain: '360° ÷ 6 = 60°.' },
      { id: 'q2', kind: 'mcq', prompt: 'What happens when this runs?', lang: 'python', code: ['def make_tea():', '    cups = 2', 'make_tea()', 'print(cups)'],
        options: ['An error, because cups only exists inside the function', '2', '0', 'make_tea'], answer: 0,
        explain: 'Variables made inside a function are local. They disappear when the function ends.' },
      { id: 'q3', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['def hop(n=1):', '    return n * 2', 'print(hop() + hop(3))'], answer: 8,
        explain: 'hop() uses the default n = 1 and returns 2. hop(3) returns 6. 2 + 6 = 8.' },
      { id: 'q4', kind: 'mcq', prompt: 'A function was called with the wrong argument. Which call draws a triangle with polygon(sides, size)?',
        options: ['polygon(3, 50)', 'polygon(50, 3)', 'polygon(3)', 'polygon("triangle")'], answer: 0,
        explain: 'The order of arguments must match the parameters: sides first, then size.' },
      { id: 'q5', kind: 'mcq', prompt: 'Breaking a big problem into smaller ones is called…', options: ['Decomposition', 'Debugging', 'Looping', 'Printing'], answer: 0,
        explain: 'Decomposition: for example, "make a game" becomes draw_board(), move_player() and check_win().' },
      { id: 'q6', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['def total(prices):', '    s = 0', '    for p in prices:', '        s = s + p', '    return s', 'print(total([10, 20, 5]))'], answer: 35,
        explain: '10 + 20 + 5 = 35.' },
      { id: 'q7', kind: 'mcq', prompt: 'Which name is best for a function that checks whether Vinc is on a spark?', options: ['is_on_spark()', 'x()', 'function1()', 'do_stuff()'], answer: 0,
        explain: 'Good names say what the function does, so others can read your code.' },
      { id: 'q8', kind: 'number', prompt: 'A function draw_square() uses 8 blocks. A program draws 5 squares by calling it. How many blocks does the program need for the calls? (Count each call as 1 block.)', answer: 5,
        explain: 'Each call is one block: 5 calls. Without a function you would need 40 blocks.' }
    ]
  },

  /* ------------------------------ Class 8 ------------------------------ */
  {
    id: 'c8-a', grade: 8, minutes: 25,
    title: 'Checkpoint: Events and lists',
    summary: 'Reacting to events, storing data in lists and indexing.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'Which of these is an event?', options: ['The space key is pressed', 'x = 5', 'A list of numbers', 'A variable name'], answer: 0,
        explain: 'An event is something that happens, which a program can react to.' },
      { id: 'q2', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['sparks = [4, 7, 1]', 'print(sparks[0])'], answer: 4,
        explain: 'Python lists start counting at 0, so sparks[0] is the first item.' },
      { id: 'q3', kind: 'number', prompt: 'What does print(len([3, 5, 8, 2])) show?', answer: 4,
        explain: 'len() counts the items in a list.' },
      { id: 'q4', kind: 'number', prompt: 'What does this print?', lang: 'python', code: ['nums = [5, 2, 9]', 'nums.append(4)', 'print(len(nums))'], answer: 4,
        explain: 'append adds one item to the end, so the list has 4 items.' },
      { id: 'q5', kind: 'number', prompt: 'A list has 5 items. What is the index of the last item?', answer: 4,
        explain: 'Indexes go 0, 1, 2, 3, 4. Forgetting this causes "off by one" bugs.' },
      { id: 'q6', kind: 'mcq', prompt: 'What does sorted([3, 1, 2]) give?', options: ['[1, 2, 3]', '[3, 2, 1]', '[3, 1, 2]', '6'], answer: 0,
        explain: 'sorted() returns a new list from smallest to largest.' },
      { id: 'q7', kind: 'number', prompt: 'What is total at the end?', lang: 'python', code: ['total = 0', 'for s in [2, 4, 6]:', '    total = total + s'], answer: 12,
        explain: '2 + 4 + 6 = 12.' },
      { id: 'q8', kind: 'mcq', prompt: 'What does colours[-1] give if colours = ["red", "green", "blue"]?', options: ['"blue"', '"red"', 'Error', '"green"'], answer: 0,
        explain: 'Index -1 means the last item.' }
    ]
  },
  {
    id: 'c8-b', grade: 8, minutes: 30,
    title: 'End of Class 8: AI basics',
    summary: 'Training data, models, bias and using AI responsibly.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'How does a machine-learning model learn?', options: ['From many examples (training data)', 'By guessing with no data', 'From one rule typed by hand', 'From the colour of the screen'], answer: 0,
        explain: 'A model finds patterns in lots of labelled examples.' },
      { id: 'q2', kind: 'mcq', prompt: 'A fruit sorter was trained only on pictures of red apples. What will probably happen with a green apple?',
        options: ['It may not recognise it as an apple', 'It will always be right', 'It will turn the apple red', 'Nothing can go wrong'], answer: 0,
        explain: 'If the training data is missing some cases, the model does badly on them. This is called bias.' },
      { id: 'q3', kind: 'mcq', prompt: 'In supervised learning, what is a label?', options: ['The right answer attached to each training example', 'The name of the program', 'A sticker on the computer', 'A type of loop'], answer: 0,
        explain: 'For example, a picture of a plastic bottle is labelled "plastic".' },
      { id: 'q4', kind: 'number', prompt: 'A waste sorter was tested on 50 items and got 45 right. What is its accuracy, in percent?', answer: 90,
        explain: '45 ÷ 50 = 0.9, which is 90%.' },
      { id: 'q5', kind: 'mcq', prompt: 'Glitch mislabelled many training pictures. What is the best fix?', options: ['Clean the data and train again', 'Train for longer on the same data', 'Use fewer pictures', 'Change the screen colour'], answer: 0,
        explain: 'Bad data makes a bad model. Fixing the labels matters more than training longer.' },
      { id: 'q6', kind: 'mcq', prompt: 'How is a rule-based chatbot different from a machine-learning chatbot?', options: ['It follows replies written by people instead of learning from examples', 'It is always smarter', 'It cannot use text', 'There is no difference'], answer: 0,
        explain: 'Rule-based bots match patterns to fixed replies. ML bots learn patterns from data.' },
      { id: 'q7', kind: 'mcq', prompt: 'Should an AI decide students\' exam marks on its own?', options: ['No. People should check important decisions made with AI', 'Yes, AI is never wrong', 'Yes, if it is fast', 'Only on Mondays'], answer: 0,
        explain: 'AI can make mistakes and be unfair. Important decisions need human review.' },
      { id: 'q8', kind: 'mcq', prompt: 'Which data should NOT be collected to train a classroom app without permission?', options: ["Students' photos and personal details", 'Anonymous quiz scores', 'The number of levels played', 'Which hat Vinc wears'], answer: 0,
        explain: 'Personal data, especially about children, needs consent from parents and must be protected.' }
    ]
  }
];

/* Shuffle each multiple-choice question's options in a fixed order (seeded by its id), so the right
   answer is not always first but every student sees the same layout. True/False keeps its order. */
function seededOrder(key: string, n: number): number[] {
  let h = 2166136261;
  for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  let seed = h >>> 0;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}
function shuffled(assessmentId: string, qn: Question): Question {
  if (qn.kind !== 'mcq' || !qn.options || (qn.options.length === 2 && qn.options[0] === 'True')) return qn;
  const order = seededOrder(assessmentId + '/' + qn.id, qn.options.length);
  return { ...qn, options: order.map(i => qn.options![i]), answer: order.indexOf(qn.answer) };
}


export function assessmentById(id: string): Assessment | undefined {
  return ASSESSMENTS.find(a => a.id === id);
}

export function assessmentsForGrade(grade: number): Assessment[] {
  return ASSESSMENTS.filter(a => a.grade === grade);
}

/** Grade a set of answers. Returns per-question correctness and the score. */
export function grade(a: Assessment, answers: Record<string, string>): { score: number; max: number; correct: Record<string, boolean> } {
  const correct: Record<string, boolean> = {};
  let score = 0;
  for (const qn of a.questions) {
    const raw = (answers[qn.id] ?? '').trim();
    const ok = raw !== '' && Number(raw) === qn.answer;
    correct[qn.id] = ok;
    if (ok) score++;
  }
  return { score, max: a.questions.length, correct };
}

/* ------------------------------ Skills, levels and objectives ------------------------------ */
/** Skill and level for each written question, as "skill|E/M/H", in question order. */
const META: Record<string, string[]> = {
  'c3-a': ['Algorithms|E', 'Tracing code|E', 'Directions and turns|E', 'Directions and turns|M', 'Tracing code|M', 'Directions and turns|E', 'Debugging|M', 'Writing programs|M'],
  'c3-b': ['Algorithms|E', 'Tracing code|M', 'Debugging|E', 'Debugging|M', 'Tracing code|M', 'Writing programs|M', 'Debugging|M', 'Writing programs|H'],
  'c4-a': ['Tracing loops|E', 'Loops|E', 'Tracing loops|M', 'Nested loops|M', 'Loops|E', 'Jump|E', 'Jump|M', 'Debugging loops|M'],
  'c4-b': ['Patterns|M', 'Tracing loops|M', 'Nested loops|H', 'Tracing loops|M', 'Jump|M', 'Debugging loops|M', 'Patterns|H', 'Jump|E'],
  'c5-a': ['Conditions|E', 'If and else|E', 'Boolean logic|M', 'Boolean logic|M', 'Boolean logic|E', 'If and else|E', 'Conditions|E', 'Problem solving|M'],
  'c5-b': ['Loops with conditions|M', 'Debugging|M', 'Boolean logic|M', 'Problem solving|H', 'Boolean logic|M', 'If and else|M', 'Problem solving|H', 'Problem solving|E'],
  'c6-a': ['Variables|E', 'Variables|M', 'Text and input|E', 'Text and input|M', 'Arithmetic|M', 'Arithmetic|M', 'Variables|E', 'Text and input|M'],
  'c6-b': ['Loops|M', 'Loops|M', 'Loops|H', 'Debugging|E', 'Debugging|M', 'Arithmetic|E', 'Text and input|M', 'Loops|M'],
  'c7-a': ['Functions|M', 'Parameters and return|E', 'Parameters and return|E', 'Parameters and return|H', 'Parameters and return|E', 'Decomposition|E', 'Parameters and return|M', 'Geometry with code|M'],
  'c7-b': ['Geometry with code|M', 'Scope|H', 'Parameters and return|H', 'Parameters and return|M', 'Decomposition|E', 'Functions|M', 'Functions|E', 'Decomposition|M'],
  'c8-a': ['Events|E', 'Lists|E', 'Lists|E', 'Lists|M', 'Lists|M', 'Lists|M', 'Loops over lists|M', 'Lists|H'],
  'c8-b': ['AI and data|E', 'AI and data|M', 'AI and data|M', 'AI and data|M', 'AI and data|M', 'AI and data|M', 'Responsible AI|E', 'Responsible AI|E']
};
const LEVEL: Record<string, Level> = { E: 'Easy', M: 'Medium', H: 'Hard' };

const OBJECTIVES: Record<string, string[]> = {
  'c3-a': ['Explain what an algorithm is', 'Predict where Vinc ends up after a short program', 'Use turns to face any direction'],
  'c3-b': ['Put steps in the right order', 'Find the line where a program goes wrong', 'Write the shortest program for a simple path'],
  'c3-c': ['Trace programs with turns and crates', 'Work out three left turns as one right turn', 'Fix a program that turns the wrong way'],
  'c4-a': ['Count how many times a loop runs its blocks', 'Replace repeated blocks with repeat', 'Use jump() to clear a crate'],
  'c4-b': ['Spot the pattern in a long program', 'Trace nested loops', 'Debug a loop that runs the wrong number of times'],
  'c4-c': ['Count moves in loops and nested loops', 'Choose the loop that matches a pattern', 'Plan a square path with nested repeats'],
  'c5-a': ['Read if / else and say which part runs', 'Work out and / or / not', 'Explain why one program can solve different boards'],
  'c5-b': ['Use a loop that repeats until a condition', 'Find endless-loop bugs', 'Pick a strategy for any simple maze'],
  'c5-c': ['Follow if / elif / else on coloured tiles', 'Trace a while loop that counts', 'Reason about the wall-follower rule'],
  'c6-a': ['Store and update values in variables', 'Use Python maths: //, % and *', 'Know that input() gives text'],
  'c6-b': ['Trace while and for loops', 'Build counters and totals', 'Fix syntax and logic errors'],
  'c6-c': ['Know that b = a copies the value, not the name', 'Apply the order of operations', 'Explain why text and numbers cannot be added'],
  'c7-a': ['Define and call functions', 'Use parameters and return values', 'Explain return vs print'],
  'c7-b': ['Break a problem into functions', 'Explain local variables (scope)', 'Turn shapes into angles with code'],
  'c7-c': ['Trace functions that call functions', 'Spot a missing argument', 'Explain why a local variable does not change a global one'],
  'c8-a': ['React to events', 'Index, add to and sort lists', 'Total a list with a loop'],
  'c8-b': ['Explain training data, labels and accuracy', 'Recognise bias in data', 'Decide when people must check an AI'],
  'c8-c': ['Use max, min, insert and dictionaries', 'Count with a loop over a list', 'Predict a nearest-neighbour answer and its accuracy']
};
const KIND = (id: string): AssessmentKind => (id.endsWith('-a') ? 'Checkpoint' : id.endsWith('-b') ? 'End of class' : 'Practice challenge');

function annotate(a: Assessment): Assessment {
  const meta = META[a.id];
  return {
    ...a, kind: a.kind ?? KIND(a.id), objectives: a.objectives ?? OBJECTIVES[a.id] ?? [],
    questions: a.questions.map((qn, i) => {
      if (qn.skill && qn.level) return qn;
      const [skill, lv] = (meta?.[i] ?? 'General|M').split('|');
      return { ...qn, skill: qn.skill ?? skill, level: qn.level ?? LEVEL[lv] };
    })
  };
}

/* ------------------------------ Practice challenges (one more per class) ------------------------------ */
const PRACTICE: Assessment[] = [
  {
    id: 'c3-c', grade: 3, minutes: 20,
    title: "Practice challenge: Pip's obstacle course",
    summary: 'Harder tracing with turns and crates, three-turn puzzles and fixing a wrong turn.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'Where does Vinc stop?', skill: 'Tracing code', level: 'Medium',
        map: ['>....', '.....', '.....', '.....', '.....'], code: ['step()', 'turnRight()', 'step()', 'step()', 'turnLeft()', 'step()'],
        options: ['C3', 'B3', 'C2', 'D3'], answer: 0, verify: { kind: 'end' },
        explain: 'B1, then Vinc faces down: B2, B3. Turning left makes it face right again, and one step reaches C3.' },
      { id: 'q2', kind: 'number', prompt: 'Vinc stops when it bumps. How many sparks has it collected by then?', skill: 'Tracing code', level: 'Medium',
        map: ['>*#*.', '.....', '.....', '.....', '.....'], code: ['step()', 'step()', 'step()'], answer: 1, verify: { kind: 'sparks', bumps: true },
        explain: 'The first step collects the spark on B1. The second step bumps into the crate on C1, so the spark on D1 is never reached.' },
      { id: 'q3', kind: 'mcq', prompt: 'Vinc faces down. It runs turnLeft() three times. Which way does it face now?', skill: 'Directions and turns', level: 'Hard',
        options: ['Left', 'Right', 'Up', 'Down'], answer: 0,
        explain: 'Down → right → up → left. Three left turns are the same as one right turn.' },
      { id: 'q4', kind: 'number', prompt: 'Vinc bumps into a crate. On which line does it happen?', skill: 'Debugging', level: 'Medium',
        map: ['.....', '.#...', '.....', '^....', '.....'], code: ['step()', 'turnRight()', 'step()', 'turnLeft()', 'step()'], answer: 5, verify: { kind: 'bump' },
        explain: 'Vinc goes up to A3, turns right and steps to B3, then faces up. Line 5 tries to step onto B2, where the crate is.' },
      { id: 'q5', kind: 'mcq', prompt: 'Which program collects the spark?', skill: 'Writing programs', level: 'Medium',
        map: ['.....', '.....', '..*..', '.....', '>....'],
        options: ['step(), step(), turnLeft(), step(), step()', 'turnLeft(), step(), step(), step(), step()', 'step(), step(), turnRight(), step(), step()', 'step(), turnLeft(), step(), step(), step()'],
        answer: 0, verify: { kind: 'wins' },
        explain: 'The spark is 2 squares right and 2 squares up. Turning right would make Vinc face down, off the board.' },
      { id: 'q6', kind: 'mcq', prompt: 'Pip says an algorithm must be in the right order. Which is the right algorithm to plant a seed?', skill: 'Algorithms', level: 'Easy',
        options: ['Dig a hole → put the seed in → cover it with soil → water it', 'Water it → dig a hole → put the seed in → cover it', 'Put the seed in → dig a hole → cover it → water it', 'Cover it → water it → dig a hole → put the seed in'], answer: 0,
        explain: 'You cannot put a seed in a hole you have not dug yet. The order of steps matters.' },
      { id: 'q7', kind: 'number', prompt: 'Vinc faces right. The spark is 2 squares right and 2 squares down. How many blocks are needed, at the fewest?', skill: 'Writing programs', level: 'Hard', answer: 5,
        explain: 'step(), step(), turnRight(), step(), step(): four moves and one turn.' },
      { id: 'q8', kind: 'mcq', prompt: "Glitch's program should reach the spark on C1, but Vinc goes off the board. What is the fix?", skill: 'Debugging', level: 'Medium',
        map: ['..*..', '.....', '>....', '.....', '.....'], code: ['step()', 'step()', 'turnRight()', 'step()', 'step()'],
        options: ['Change turnRight() to turnLeft()', 'Add another step()', 'Delete the first step()', 'Change step() to jump()'], answer: 0,
        explain: 'The spark is up, so Vinc must turn left. Turning right makes it face down, towards the edge.' }
    ]
  },
  {
    id: 'c4-c', grade: 4, minutes: 20,
    title: "Practice challenge: Loopa's loop lab",
    summary: 'Counting moves in loops, nested loops, loops with jumps and choosing the right pattern.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'How many step() blocks run?', skill: 'Tracing loops', level: 'Easy',
        code: ['repeat 3:', '  step()', '  step()', 'step()'], answer: 7, verify: { kind: 'moves' },
        explain: 'The loop runs 2 steps 3 times (6), and the last step() is outside the loop: 7.' },
      { id: 'q2', kind: 'number', prompt: 'How many step() blocks run?', skill: 'Nested loops', level: 'Medium',
        code: ['repeat 3:', '  repeat 2:', '    step()', '  turnLeft()', 'step()'], answer: 7, verify: { kind: 'moves' },
        explain: 'The inner loop runs 2 steps, 3 times: 6. Then one more step after the loops: 7.' },
      { id: 'q3', kind: 'mcq', prompt: 'Where does Vinc stop?', skill: 'Tracing loops', level: 'Medium',
        map: ['.....', '.....', '.....', '.....', '>....'], code: ['repeat 2:', '  step()', '  turnLeft()', '  step()', '  turnRight()'],
        options: ['C3', 'B4', 'D3', 'C2'], answer: 0, verify: { kind: 'end' },
        explain: 'Each round goes one square right and one square up: B4 after the first round, C3 after the second.' },
      { id: 'q4', kind: 'number', prompt: 'How many sparks does Vinc collect?', skill: 'Jump', level: 'Easy',
        map: ['>#*#*', '.....', '.....', '.....', '.....'], code: ['repeat 2:', '  jump()'], answer: 2, verify: { kind: 'sparks' },
        explain: 'Each jump clears a crate and lands on a spark: C1, then E1.' },
      { id: 'q5', kind: 'number', prompt: 'Vinc bumps. On which line is the block that bumps?', skill: 'Debugging loops', level: 'Medium',
        map: ['>..#.', '.....', '.....', '.....', '.....'], code: ['repeat 4:', '  step()'], answer: 2, verify: { kind: 'bump' },
        explain: 'Line 2 runs: B1, C1, then the crate on D1. The loop number is too big, or a jump() is needed.' },
      { id: 'q6', kind: 'mcq', prompt: 'Which program does the same as: step(), turnLeft(), step(), turnLeft(), step(), turnLeft(), step(), turnLeft()?', skill: 'Patterns', level: 'Easy',
        options: ['repeat 4: step(), turnLeft()', 'repeat 2: step(), turnLeft()', 'repeat 4: step()', 'repeat 8: turnLeft()'], answer: 0,
        explain: 'The pair step(), turnLeft() is written 4 times.' },
      { id: 'q7', kind: 'mcq', prompt: 'Loopa wants Vinc to walk round a square with 2 steps on each side. Which program works?', skill: 'Nested loops', level: 'Hard',
        options: ['repeat 4: (repeat 2: step()), turnRight()', 'repeat 2: (repeat 4: step()), turnRight()', 'repeat 4: step(), turnRight()', 'repeat 3: step(), step(), turnRight()'], answer: 0,
        explain: 'A square has 4 sides. Each side is 2 steps, then a turn.' },
      { id: 'q8', kind: 'number', prompt: 'A repeat 5 has a repeat 4 inside it, with one step() inside that. How many steps run?', skill: 'Nested loops', level: 'Medium', answer: 20,
        explain: 'The inside loop runs 4 steps each time. The outside loop runs it 5 times: 4 × 5 = 20.' }
    ]
  },
  {
    id: 'c5-c', grade: 5, minutes: 25,
    title: "Practice challenge: Hoot's decision maze",
    summary: 'if / elif / else on tiles, while loops, logic puzzles and the wall-follower rule.',
    questions: [
      { id: 'q1', kind: 'mcq', prompt: 'Vinc is blocked. What does it do?', skill: 'If and else', level: 'Easy', lang: 'python',
        code: ['if blocked():', '    turn_left()', 'else:', '    step()'], options: ['Turns left', 'Steps forward', 'Turns left and then steps', 'Nothing'], answer: 0,
        explain: 'blocked() is True, so only the if part runs. The else part is skipped.' },
      { id: 'q2', kind: 'mcq', prompt: 'x = 3. Which condition is True?', skill: 'Boolean logic', level: 'Medium',
        options: ['x > 2 and x < 4', 'x > 3', 'x == 4 or x < 3', 'not x == 3'], answer: 0,
        explain: '3 is more than 2 and less than 4, so both parts are True. The others are all False.' },
      { id: 'q3', kind: 'number', prompt: 'What does this print?', skill: 'Loops with conditions', level: 'Hard', lang: 'python',
        code: ['n = 0', 'while n < 5:', '    n = n + 2', 'print(n)'], answer: 6,
        explain: 'n goes 0 → 2 → 4 → 6. At 6 the condition n < 5 is False, so the loop stops and 6 is printed.' },
      { id: 'q4', kind: 'mcq', prompt: 'Which line keeps Vinc moving until it reaches a spark?', skill: 'Loops with conditions', level: 'Easy',
        options: ['while not at_spark():', 'while at_spark():', 'if at_spark():', 'repeat 3:'], answer: 0,
        explain: 'while not at_spark() repeats as long as Vinc is not on a spark.' },
      { id: 'q5', kind: 'mcq', prompt: 'The wall-follower rule is: if blocked, turn left; else step. What happens in a dead end?', skill: 'Problem solving', level: 'Hard',
        options: ['Vinc keeps turning until it faces the way out', 'Vinc stops for ever', 'Vinc jumps over the wall', 'The program crashes'], answer: 0,
        explain: 'Each time round the loop Vinc is blocked, so it turns. After enough turns it faces the open square it came from.' },
      { id: 'q6', kind: 'mcq', prompt: 'Vinc is on a blue tile. What does it do?', skill: 'If and else', level: 'Medium', lang: 'python',
        code: ['if tile() == "red":', '    turn_right()', 'elif tile() == "green":', '    step()', 'else:', '    turn_left()'],
        options: ['turn_left()', 'turn_right()', 'step()', 'Nothing'], answer: 0,
        explain: 'Blue is not red and not green, so the else part runs.' },
      { id: 'q7', kind: 'mcq', prompt: 'Why does this loop never end?', skill: 'Debugging', level: 'Medium', lang: 'python',
        code: ['while not at_spark():', '    turn_left()'],
        options: ['Vinc only turns, so it never reaches the spark', 'The loop needs a semicolon', 'turn_left() is spelled wrong', 'There is no bug'], answer: 0,
        explain: 'Nothing in the loop moves Vinc, so at_spark() never becomes True.' },
      { id: 'q8', kind: 'number', prompt: 'How many of these are True?  4 > 2   ·   3 == 3   ·   2 > 5   ·   not False', skill: 'Boolean logic', level: 'Hard', answer: 3,
        explain: '4 > 2 is True, 3 == 3 is True, 2 > 5 is False and not False is True: three are True.' }
    ]
  },
  {
    id: 'c6-c', grade: 6, minutes: 25,
    title: "Practice challenge: Pocket's Python workshop",
    summary: 'Copying values, order of operations, text and numbers, and loops that halve.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'What does this print?', skill: 'Variables', level: 'Hard', lang: 'python',
        code: ['a = 5', 'b = a', 'a = 9', 'print(b)'], answer: 5,
        explain: 'b = a copies the value 5 into b. Changing a afterwards does not change b.' },
      { id: 'q2', kind: 'number', prompt: 'What does this print?', skill: 'Loops', level: 'Easy', lang: 'python',
        code: ['score = 0', 'for i in range(3):', '    score = score + 10', 'print(score)'], answer: 30,
        explain: 'The loop adds 10 three times: 10, 20, 30.' },
      { id: 'q3', kind: 'mcq', prompt: 'What does print("Vinc" * 3) show?', skill: 'Text and input', level: 'Medium',
        options: ['VincVincVinc', 'Vinc3', 'Error', 'Vinc Vinc Vinc'], answer: 0,
        explain: 'Multiplying text repeats it, with no spaces added.' },
      { id: 'q4', kind: 'number', prompt: 'What does print(2 + 3 * 4) show?', skill: 'Arithmetic', level: 'Medium', answer: 14,
        explain: 'Python multiplies before it adds: 3 × 4 = 12, then 2 + 12 = 14.' },
      { id: 'q5', kind: 'number', prompt: 'What does this print?', skill: 'Arithmetic', level: 'Medium', lang: 'python',
        code: ['x = 17', 'print(x % 5)'], answer: 2,
        explain: '% gives the remainder: 17 ÷ 5 is 3 remainder 2.' },
      { id: 'q6', kind: 'mcq', prompt: 'The user types 11. What happens?', skill: 'Debugging', level: 'Hard', lang: 'python',
        code: ['age = input("Age? ")', 'print(age + 1)'],
        options: ['An error: text and a number cannot be added', 'It prints 12', 'It prints 111', 'It prints 11'], answer: 0,
        explain: 'input() gives text ("11"). Use int(age) + 1 to do maths with it.' },
      { id: 'q7', kind: 'number', prompt: 'What does this print?', skill: 'Loops', level: 'Hard', lang: 'python',
        code: ['n = 10', 'while n > 1:', '    n = n // 2', 'print(n)'], answer: 1,
        explain: 'n goes 10 → 5 → 2 → 1. At 1 the loop stops, so 1 is printed.' },
      { id: 'q8', kind: 'mcq', prompt: 'A metro ride costs ₹20 and students pay half. Which line is right?', skill: 'Arithmetic', level: 'Easy',
        options: ['fare = 20 / 2', 'fare = "20" / 2', 'fare = 20 // 0', 'fare = 20 - half'], answer: 0,
        explain: '20 / 2 is 10.0. Text cannot be divided, dividing by 0 is an error, and half is not defined.' }
    ]
  },
  {
    id: 'c7-c', grade: 7, minutes: 25,
    title: "Practice challenge: Chef Tadka's function kitchen",
    summary: 'Functions that call functions, missing arguments, scope and angles.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'What does this print?', skill: 'Parameters and return', level: 'Medium', lang: 'python',
        code: ['def square(n):', '    return n * n', 'print(square(4) + square(2))'], answer: 20,
        explain: 'square(4) is 16 and square(2) is 4: 16 + 4 = 20.' },
      { id: 'q2', kind: 'mcq', prompt: 'What happens when this runs?', skill: 'Parameters and return', level: 'Medium', lang: 'python',
        code: ['def hello(name):', '    print("Hi " + name)', 'hello()'],
        options: ['An error: the name argument is missing', 'It prints Hi', 'It prints Hi name', 'Nothing'], answer: 0,
        explain: 'hello needs one argument. Calling hello() without it is a TypeError.' },
      { id: 'q3', kind: 'number', prompt: 'What does this print?', skill: 'Functions', level: 'Hard', lang: 'python',
        code: ['def walk(n):', '    return n * 2', 'def run(n):', '    return walk(n) + 1', 'print(run(5))'], answer: 11,
        explain: 'run(5) calls walk(5), which returns 10. Then 10 + 1 = 11.' },
      { id: 'q4', kind: 'mcq', prompt: 'Which line calls a function?', skill: 'Functions', level: 'Easy',
        options: ['make_pizza(2)', 'def make_pizza(n):', 'return n', 'pizza = 2'], answer: 0,
        explain: 'A call is the function name followed by brackets with any arguments. def only defines it.' },
      { id: 'q5', kind: 'number', prompt: "Chef Tadka's cook(dish) function runs 3 steps. A program calls it 4 times. How many steps run?", skill: 'Decomposition', level: 'Easy', answer: 12,
        explain: 'Each call runs all 3 steps: 3 × 4 = 12. The recipe is written once but used 4 times.' },
      { id: 'q6', kind: 'mcq', prompt: 'What is printed?', skill: 'Scope', level: 'Hard', lang: 'python',
        code: ['total = 0', 'def add(x):', '    total = x', 'add(5)', 'print(total)'],
        options: ['0', '5', 'Error', 'x'], answer: 0,
        explain: 'total = x inside the function makes a new local variable. The total outside stays 0.' },
      { id: 'q7', kind: 'number', prompt: 'How many degrees should Vinc turn at each corner of a regular pentagon (5 sides)?', skill: 'Geometry with code', level: 'Medium', answer: 72,
        explain: 'Vinc turns 360 degrees in total: 360 ÷ 5 = 72.' },
      { id: 'q8', kind: 'mcq', prompt: 'What is the best way to write "Vinc tidies the lab" with functions?', skill: 'Decomposition', level: 'Easy',
        options: ['pick_up(), sort(), put_away()', 'One function with 200 lines', 'No functions at all', 'tidy(tidy(tidy()))'], answer: 0,
        explain: 'Small functions with clear names are easier to read, test and reuse.' }
    ]
  },
  {
    id: 'c8-c', grade: 8, minutes: 25,
    title: "Practice challenge: Nova's data lab",
    summary: 'List and dictionary tools, counting with loops, events and judging an AI model.',
    questions: [
      { id: 'q1', kind: 'number', prompt: 'What does this print?', skill: 'Lists', level: 'Medium', lang: 'python',
        code: ['nums = [3, 8, 1, 6]', 'print(max(nums) - min(nums))'], answer: 7,
        explain: 'The biggest is 8 and the smallest is 1: 8 - 1 = 7.' },
      { id: 'q2', kind: 'mcq', prompt: 'What does this print?', skill: 'Lists', level: 'Hard', lang: 'python',
        code: ['parts = ["wheels", "antenna"]', 'parts.insert(0, "gears")', 'print(parts[1])'],
        options: ['wheels', 'gears', 'antenna', 'Error'], answer: 0,
        explain: 'insert(0, ...) puts "gears" first, so the list is gears, wheels, antenna. Index 1 is "wheels".' },
      { id: 'q3', kind: 'number', prompt: 'What does this print?', skill: 'Loops over lists', level: 'Medium', lang: 'python',
        code: ['count = 0', 'for t in ["cat", "dog", "cat", "cat"]:', '    if t == "cat":', '        count += 1', 'print(count)'], answer: 3,
        explain: 'The loop checks each item and counts the three "cat" items.' },
      { id: 'q4', kind: 'mcq', prompt: 'The up key is pressed. What does Vinc do?', skill: 'Events', level: 'Easy', lang: 'python',
        code: ['def on_key(key):', '    if key == "space":', '        jump()', '    elif key == "up":', '        step()'],
        options: ['step()', 'jump()', 'Nothing', 'Both'], answer: 0,
        explain: 'The handler gets key = "up". It is not "space", so the elif part runs.' },
      { id: 'q5', kind: 'mcq', prompt: 'A nearest-neighbour model was trained on (10, "small") and (90, "big"). What does it say for 30?', skill: 'AI and data', level: 'Medium',
        options: ['small', 'big', 'It cannot answer', 'medium'], answer: 0,
        explain: '30 is 20 away from 10 and 60 away from 90. The nearest example is labelled "small".' },
      { id: 'q6', kind: 'number', prompt: 'A model got 18 of 24 test answers right. What is its accuracy, in percent?', skill: 'AI and data', level: 'Medium', answer: 75,
        explain: '18 ÷ 24 = 0.75, which is 75%.' },
      { id: 'q7', kind: 'mcq', prompt: 'A face-unlock app works badly for people with darker skin. What is the most likely cause?', skill: 'Responsible AI', level: 'Medium',
        options: ['Its training data had too few photos of people with darker skin', 'The phone is too old', 'Their faces move too fast', 'AI is always 100% accurate'], answer: 0,
        explain: 'A model learns from its examples. If some groups are missing from the data, it works worse for them. This is called bias.' },
      { id: 'q8', kind: 'mcq', prompt: 'What does this print?', skill: 'Lists', level: 'Easy', lang: 'python',
        code: ['scores = {"Asha": 7, "Ravi": 9}', 'print(scores["Ravi"])'],
        options: ['9', '7', 'Ravi', 'Error'], answer: 0,
        explain: 'A dictionary looks up a value by its key. The key "Ravi" holds 9.' }
    ]
  }
];

export const ASSESSMENTS: Assessment[] = [...WRITTEN, ...PRACTICE]
  .map(annotate)
  .sort((a, b) => a.grade - b.grade || a.id.localeCompare(b.id))
  .map(a => ({ ...a, questions: a.questions.map(qn => shuffled(a.id, qn)) }));
