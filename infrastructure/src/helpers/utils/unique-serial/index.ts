/* ---------- External ---------- */
import { customAlphabet } from 'nanoid';

/* ---------- Constants ---------- */
const SIZE = 14;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-'; // A-Z 0-9 -

export const unique_serial = () => customAlphabet(ALPHABET)(SIZE);
