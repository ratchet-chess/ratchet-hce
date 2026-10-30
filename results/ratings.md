# Ratings

Ratings on the CCRL Blitz scale, fitted by `tools/fit-rating.ts` against anchors held at their
published ratings. `tools/calibrate.sh` writes a gauntlet's row at the end of its run, through
`tools/results.ts`. A row is keyed by player and protocol: a new run replaces the row with the same
key, and a run under another protocol adds its own.

- **player** is `release[@level]`, as the match tools name it (`tools/player.sh`).
- **±** is the fit's 95% interval. Games are treated as independent, so it is slightly narrow.
- **score** is the player's share of the points against the anchors. At 0% or 100% the fit has no
  finite value, and the row says the player lies below or above the anchors it played.
- **protocol** is the run's time control and conditions. Rows under different protocols do not
  compare.

| player | rating | ± | games | score | anchors | protocol | commit | date |
|---|---|---|---|---|---|---|---|---|
