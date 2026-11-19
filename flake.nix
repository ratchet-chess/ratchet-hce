{
  # This flake only pins nixpkgs, for tools/package.ts: it builds wasm2c (wabt) and SIMDe from this pin with
  # `nix build --inputs-from <repo root>`. Keep flake.lock on the nixpkgs revision that ratchet-historical's
  # flake.lock pins, so the repos that hold this package tool build with one wasm2c.
  description = "the nixpkgs pin of the package tool";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  # No packages: ratchet-bench's tools/ws.ts reads this empty set as "no image here" and uses its own images.
  outputs = { ... }: { packages.x86_64-linux = { }; };
}
