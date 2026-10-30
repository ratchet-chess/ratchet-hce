/**
 * The limits of a UCI `go`, as the front end parses them. The host passes them
 * to the release, which times itself as its original did.
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
