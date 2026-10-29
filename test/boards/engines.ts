/** Every board representation under comparison. Add a new one here to put it in test and bench. */
import { core } from "./core.ts";
import type { PerftEngine } from "./suite.ts";
import { x88 } from "./x88/perft.ts";

export const ENGINES: PerftEngine[] = [x88, core];
