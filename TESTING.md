# ToAPIs migration validation — 2026-11-12

Scope: the existing `cloud-hug-style-transfer` brand-upgrade Skill and its owning package, version 0.7.0. No other Skill is migrated. Original brand, model and product assets are unchanged. Business rules include the user's 2026-11-11 ZIP revisions, including explicitly selected directions in the image inventory.

## Local checks

- Node.js 24.16.0 on Windows; package minimum remains Node.js 22.
- Syntax and release-integrity validation passed.
- Package tests cover missing/wrong/old media runtimes, repeated references, recovery commands, current-host isolation, authorized direction counts, installation, packed dependencies, old-version upgrades, local edits, failed updates and recovery.
- The sandbox initially blocked npm-cache writes in three packaging tests. These were rerun with cache/network access and passed; no test assertions were bypassed.
- The managed Skill was installed into the selected WorkBuddy Skill directory; its independent runtime, file hashes and the sibling toapiscli 0.1.1 runtime were verified. Credentials were reused through toapiscli and never bundled.

## One paid reference-image smoke test

- Provider: `@petercjl/toapiscli` 0.1.1, existing configured account.
- Model: `gpt-image-2.6-sunburst`; resolution: 2K; aspect: 3:2; exactly one generation submission.
- References: `assets/products/dog.jpg` for product identity and `assets/approved/detail-final-20261016/15.jpg` for studio atmosphere.
- The initial wait returned running. `task wait --directory ORIGINAL_DIRECTORY` resumed the same request and downloaded the completed PNG; no resubmission.
- Provider billing was settled: USD 0.024 / 4.8 credits.
- Actual pixels were viewed: a single brown corduroy dog pillow in a pale blue and cream scene, without overlaid text. This is media integration evidence, not approval of a full commercial detail-page set or proof of exact product measurements.
- Prompt, ordered reference hashes, original request directory, task receipt, output dimensions and review are retained in the local test manifest. They are not uploaded to the repository.

## Boundaries

WorkBuddy's native in-conversation Skill discovery and a complete user-driven product-card / planning / detail-page session have not been exercised. The installed files and real CLI generation chain are verified separately; `hostDiscovery` remains pending until WorkBuddy loads the Skill. No npm release is performed by this GitHub sync. Online canvas and HTML delivery are intentionally absent.
