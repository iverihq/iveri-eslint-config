import { square } from './type-import.js';
import { readFileSync } from 'node:fs';

export const sides = square.sides + readFileSync.length;
