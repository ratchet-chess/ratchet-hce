/**
 * The own engine's WASI build: the engine with its UCI front end inside, a
 * WASI preview-1 command module that speaks UCI on stdin and stdout. index.ts is
 * the wasm the host and the tools load, through its exports; this file uses the
 * same functions, so both search alike and have one node signature.
 *
 * tools/build.sh compiles it with `--use WASI=1 --exportStart _start`, so the
 * module's start, this file's top level, runs when a WASI host calls `_start`.
 */
import { UciEngine, uciMain } from "../../core/uci";
import {
  clear, evaluate, go, goClock, hashfull, init, legalMoves, newGame, nodesSearched, playMove, put, pvLength, pvMove, rootMove, setCastleRooks, setHash, setNodeLimit, setState,
  timeTrace, version,
} from "./index";

init();
const e = new UciEngine();
e.version = version();
e.benchDepth = 12;
e.chess960 = true;
e.hasHashfull = true;
e.hasTimeTrace = true;
e.hasNodeLimit = true;
e.clear = clear;
e.put = put;
e.setState = setState;
e.setCastleRooks = setCastleRooks;
e.playMove = playMove;
e.legalMoves = legalMoves;
e.rootMove = rootMove;
e.go = go;
e.goClock = goClock;
e.setNodeLimit = setNodeLimit;
e.setHash = setHash;
e.newGame = newGame;
e.pvLength = pvLength;
e.pvMove = pvMove;
e.nodes = nodesSearched;
e.hashfull = hashfull;
e.evaluate = evaluate;
e.timeTrace = timeTrace;
uciMain(e);
