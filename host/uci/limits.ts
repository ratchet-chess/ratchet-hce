/**
 * The limits of a UCI `go`, as the front end parses them. The host passes them
 * to the engine, which times itself.
 */
export interface GoLimits {
  wtime?: number;
  btime?: number;
  winc?: number;
  binc?: number;
  movestogo?: number;
  movetime?: number;
  depth?: number;
  nodes?: number;
  infinite?: boolean;
}
