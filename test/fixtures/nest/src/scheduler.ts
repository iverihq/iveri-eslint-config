import { Clock } from './clock.js';
import { Injectable } from './injectable.js';

@Injectable()
export class Scheduler {
    constructor(private readonly clock: Clock) {}

    elapsedSince(start: number): number {
        return this.clock.now() - start;
    }
}
