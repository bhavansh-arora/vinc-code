import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384, R = 8, P = 1, KEYLEN = 32;

/** Hash a password with scrypt. Format: scrypt$N$r$p$salt$hash (base64). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$');
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: +n, r: +r, p: +p });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const COLOURS = ['red', 'blue', 'green', 'gold', 'pink', 'teal', 'plum', 'mint', 'rust', 'sky'];
const ANIMALS = ['tiger', 'panda', 'eagle', 'otter', 'koala', 'zebra', 'gecko', 'camel', 'whale', 'lemur', 'bison', 'heron', 'llama', 'mango', 'comet', 'robot'];

/** Easy-to-type password for children, e.g. "bluetiger47". */
export function kidPassword(): string {
  return COLOURS[randomInt(COLOURS.length)] + ANIMALS[randomInt(ANIMALS.length)] + randomInt(10, 100);
}

/** Temporary password for adults; they must change it at first sign-in. */
export function tempPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += alphabet[randomInt(alphabet.length)];
  return s;
}
