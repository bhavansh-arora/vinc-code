/** Vinc's crew. One new friend joins in every class, so the cast grows as students move up. */
export type CharId = 'vinc' | 'glitch' | 'pip' | 'loopa' | 'hoot' | 'pocket' | 'tadka' | 'nova';

export interface CrewMember {
  id: CharId; name: string; what: string;
  /** The class they join in (0: there from the start). */
  joins: number;
  /** The coding idea they stand for. */
  idea: string;
  bio: string;
  /** Their catchphrase, used on the landing page and lesson lists. */
  line: string;
  color: string;
}

export const CREW: CrewMember[] = [
  { id: 'vinc', name: 'Vinc', what: 'robot built from spare parts', joins: 0, idea: 'Programs', color: '#D98A1C',
    bio: 'Vinc does exactly what your code says, nothing more and nothing less. Every class finished wins Vinc a new part.', line: 'Beep! Tell me what to do!' },
  { id: 'glitch', name: 'Glitch', what: 'mischievous beetle', joins: 0, idea: 'Bugs and debugging', color: '#C2502A',
    bio: 'Glitch sneaks bugs into programs. Catch Glitch lessons hide one mistake for you to find and fix.', line: 'Hee hee! Find my bug!' },
  { id: 'pip', name: 'Pip', what: 'firefly bot', joins: 3, idea: 'Sequencing', color: '#E8B030',
    bio: 'Pip lights the path one square at a time. First this, then that: Pip loves things in the right order.', line: 'First this, then that!' },
  { id: 'loopa', name: 'Loopa', what: 'snail bot', joins: 4, idea: 'Loops', color: '#1F6F66',
    bio: 'Loopa goes round and round and never gets dizzy. Loopa spots patterns and turns them into loops.', line: 'Again, and again, and again!' },
  { id: 'hoot', name: 'Hoot', what: 'owl bot with sensor eyes', joins: 5, idea: 'If and else', color: '#8C3557',
    bio: 'Hoot looks before leaping. Its sensor eyes ask a question, and the answer decides what happens next.', line: 'If it is blocked, else...' },
  { id: 'pocket', name: 'Pocket', what: 'kangaroo bot', joins: 6, idea: 'Variables', color: '#C2502A',
    bio: 'Pocket keeps labelled boxes in its pouch. Each box has a name and holds one value, which can change.', line: 'Let me keep that for you!' },
  { id: 'tadka', name: 'Chef Tadka', what: 'cooking robot', joins: 7, idea: 'Functions', color: '#4C7424',
    bio: 'Chef Tadka writes every dish as a recipe: give it a name once, then cook it any time with one word.', line: 'Write the recipe once!' },
  { id: 'nova', name: 'Nova', what: 'AI drone', joins: 8, idea: 'Lists, events and AI', color: '#34465A',
    bio: 'Nova learns from examples. Show it good data and it gets smarter; show it bad data and it gets confused.', line: 'Show me examples!' }
];

export const crewMember = (id: CharId) => CREW.find(c => c.id === id)!;
/** The friend who joins in this class (Vinc for unknown classes). */
export const buddyOf = (grade: number) => CREW.find(c => c.joins === grade) ?? CREW[0];
/** Everyone a student in this class has met. */
export const crewFor = (grade: number) => CREW.filter(c => c.joins <= grade);
