import { randomInt } from 'node:crypto';

// No 0/O, 1/I/L: easy to read aloud and type from a printed card.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function randomCode(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Joining code for a school, e.g. "DPS-7KQ2". Students and teachers get different codes. */
export const joinCode = (schoolCode: string) => `${schoolCode.toUpperCase()}-${randomCode(4)}`;
/** A student's family code, given to parents. */
export const familyCode = () => randomCode(6);
/** A School ID issued by VINC so a school can register itself. */
export const schoolId = () => `VL-${randomCode(6)}`;

export function normCode(s: unknown, max = 12): string {
  return String(s ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, max);
}
