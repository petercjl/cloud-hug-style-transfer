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

## Product-scale and complete-page revision — 2026-11-12

This revision accepts prepared product photographs as well as existing product pages. After product cards it preserves independent human-product scale evidence, carries that evidence into planning and actual generation inputs, and adds scale review. The default inventory is now one complete text-free page per selected page/direction, including all three-image or four-grid content slots. Explicit split-assets requests remain supported.

Regression coverage includes the complete-page default, grouped product colors, selected directions, a single four-grid direction producing one output, explicit split assets and the installed inventory helper. Skill-format, local-reference and original-asset preservation checks passed before repository integration. Package integrity manifests are regenerated for the changed resources without a version bump.

The earlier paid media smoke test above predates this scale revision. No new paid generation, native host session or visual proof of scale accuracy is claimed for these changes. GitHub synchronization does not publish an npm release or update another host's installed Skill.

## Single-plan automatic full-set revision — 2026-11-12

Workflow revision: `2026-11-12-single-plan`; package version remains 0.7.0. The default is one plan and one complete image per page, with product-card, independent scale, four-grid content and bounded full-set scope confirmed before detailed planning. Plan review, pilot-page selection and per-batch approval are explicit opt-in. The project manifest retains current confirmation, scope and task/review state; existing partial scope and paid-retry limits remain effective.

- All 39 package tests passed with `npm test`, including seven inventory/brand-upgrade tests. A single-shape mushroom fixture now produces 10 detail outputs for either one or two colors, and a four-grid page produces one output without a direction selection. Explicit multiple directions, split assets, partial scope and an installed helper remain covered.
- Syntax and release-integrity checks passed. The initial direct Node test invocation omitted the npm entry required by packaging tests; the suite was rerun through npm. A later run required refreshed resource hashes and network access for the existing declared npm dependencies; the final run passed without skipped assertions.
- Skill frontmatter and UI metadata were checked using the repository's existing YAML parser because the bundled Python quick validator's PyYAML dependency was unavailable. All 55 local Markdown links and eight JSON resources parsed, and all 51 original assets retained their hashes.
- The 15 changed Skill resources were copied to the user-selected editable directory and the existing WorkBuddy local customization, after checking for conflicting edits and verifying backups. Existing WorkBuddy managed metadata, runtime and unrelated local changes were preserved; this does not claim a fresh managed installation or native host reload.

No paid generation or new native WorkBuddy conversation was executed for this revision. The prior test-run artifacts were left intact. This GitHub sync does not publish an npm release; behavioral acceptance in a new WorkBuddy task remains separate from file, inventory and package validation.

## Reference-first prompts and visual review — 2026-11-12

Workflow revision: `2026-11-12-reference-first`; package version remains 0.7.0. This documentation revision makes applicable human-product images the visual scale authority, removes estimated size/body/furniture ratios and redundant size questions, and requires the corresponding approved page to guide both layout and brand photography. Whole-product displays retain scale references even when the output is person-free. Per-slot reviews explicitly cover scale, seamless studio, visible pale-blue support, applicable wood furniture, lighting and task fidelity.

- Seven existing brand-upgrade/inventory tests passed, including single-plan full sets, one complete four-grid output and the installed helper. No executable business logic was changed, and no new tests were added merely to match document wording.
- Skill frontmatter and UI metadata were validated with the repository's existing YAML parser; the Python quick validator could not run because PyYAML is absent. Local Markdown links, JSON resources and all 51 original asset hashes were checked. Resource integrity manifests were regenerated without a version bump.
- The five reported failure patterns were reviewed against the amended instructions: guessed body ratios, all-cream support, grey product subframes, residential architecture, and template-count/size copying. These are instruction-level checks, not evidence of newly generated visual results.
- The user's original generation records and images remain untouched. No paid generation, native host reload, remote push or npm publication is part of this revision's validation.

The subsequent GitHub synchronization removes CI's retired SealSeek installation and its unconfigured live `doctor` invocation. Release integrity is checked explicitly; all 13 focused ToAPIs and maintenance tests passed locally, exercising dependency discovery and `doctor` with isolated fixtures. CI makes no live media calls and requires no service credentials.

## Staged review and simplified references — 2026-11-13

Workflow revision: `2026-11-13-staged-review`; package version remains 0.7.0. Business planning is based on the accepted single-plan revision `2d31a46`. Page roles, product grouping, one complete image per page, the media runtime and all original assets are preserved. Existing examples provide generation-time style only; independent human-product photographs provide visual scale. The default first three pages are 03, 04 and 05; subsequent generation follows an explicit stepwise or remaining-batch decision.

- Seven existing brand-upgrade/inventory tests passed, including grouped colors, single-plan full sets, one complete four-grid output and the installed helper. No executable business logic was changed or new wording-matching tests added.
- Release integrity and Git whitespace checks passed. The repository's existing YAML parser validated Skill frontmatter and UI metadata; all 79 local Markdown links and eight JSON resources were checked, and the hashes of all 51 original assets were preserved. The Python quick validator remains unavailable because PyYAML is not installed; no dependency was installed for this documentation change.
- Manual instruction review covered: first-three completion waits; a plain continuation advances one page; modification stays on the current page/batch; an explicit batch choice covers only remaining pages; partial scope does not expand; waiting survives recovery; a three-hand output cannot pass basic review. This is document-level validation, not an autonomous live host trial.
- The final prompt review is centralized in media execution, generation decisions in planning, and review/current progress in the existing manifest guidance. Markdown instruction text is approximately 13% shorter than the prior revision.
- No paid generation, native WorkBuddy reload, remote push or npm publication was performed as part of these checks. The user's existing generated images and task records were not changed.
