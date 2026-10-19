# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## v1.4.0 - 2026-10-19

22 features, 12 fixes, 14 ci, 3 docs, 6 chore, 3 other; breaking: 0

### Features

- rooms: a room keeps when its prep ends (#91) by @merv1n34k
- feedback: events define their feedback form; answers score it (#90) by @merv1n34k
- scores: iron speeches and who actually spoke (#89) by @merv1n34k
- stats: adjudicator statistics under their own name (#88) by @merv1n34k
- admins: merge one user's participations into another account (#87) by @merv1n34k
- rooms: motion created_at in the round rooms read (#85) by @merv1n34k
- rooms: ballot read-back - score values in room reads, half-point storage (#84) by @merv1n34k
- stats: statistics endpoints for speakers, teams, judges and organisations (#81) by @merv1n34k
- rooms: judge-set per-room motions (+ motion keyword) (#79) by @merv1n34k
- scores: confirmable ballots, completed rooms stay editable (#77) by @merv1n34k
- teams: swing team flag excluded from team standings (#76) by @merv1n34k
- participants: attendance check-in with attendance-aware team generation (#75) by @merv1n34k
- events: public event listing endpoint (#74) by @merv1n34k
- admin: endpoint to anonymise a user while preserving history (#78) by @merv1n34k
- api: opt-in pagination for list endpoints (#62) by @merv1n34k
- core: record creation and update timestamps on every table (#59) by @merv1n34k
- events: add GET /events/:eventId detail endpoint (#60) by @merv1n34k
- core: archive-by-default record lifecycle with explicit hard delete (#58) by @merv1n34k
- scoring: room reopen for ballot correction + CI test run (#57) by @merv1n34k
- v2 architecture, shallow nesting, and api refactor (#25) by @DmytroTarasenk0
- api: add /healthz and /readyz HTTP probes (#23) by @thefirstarcher
- v2 API - speaker-centric universal architecture (#3) by @merv1n34k

### Fixes

- standings: speaker totals are plain sums of speech scores (#102) by @merv1n34k
- participants: archived teams and rooms no longer block removal (#101) by @merv1n34k
- api: correct statuses and shapes found in the api audit (#95) by @merv1n34k
- teams: accept only speakers as team members (#94) by @merv1n34k
- motions: cap the keyword at 32 characters with a 400 (#93) by @merv1n34k
- participants: never serialise the guest claim token hash (#92) by @merv1n34k
- users: scrub participant display names on every self-delete path (#83) by @merv1n34k
- api: exempt internal traffic from rate limits (#80) by @merv1n34k
- deps: bump vulnerable transitive dependencies (#82) by @merv1n34k
- Potential fix for code scanning alert no. 1: Workflow does not contain permissions (#20) by @thefirstarcher
- Potential fix for code scanning alert no. 2: Workflow does not contain permissions (#19) by @thefirstarcher
- valid for eslint (278e8e3) by @DmytroTarasenk0

### Other

- chore: opendebate-engine name, versioned images, release flow and Makefile (#105) by @merv1n34k
- chore(deps): update npm dependencies (#103) by @merv1n34k
- ci: validate pull requests and pushes on nightly too (#104) by @merv1n34k
- chore: license the engine under mit (#97) by @merv1n34k
- docs(openapi): match the spec to what the api really answers (#96) by @merv1n34k
- ci: publish images on main only, preview by label, drop the k8s bump (#98) by @merv1n34k
- docs: document opt-in pagination params on list endpoints (#63) by @merv1n34k
- docs: add OpenAPI 3.0 specification for the full API surface (#61) by @merv1n34k
- chore: update the dependencies (#56) by @DmytroTarasenk0
- Tournament Elimination, Conflicts, Feedback, Standings, and Schema Optimisation (#47) by @DmytroTarasenk0
- Expand API test coverage (#40) by @DmytroTarasenk0
- ci: Fixed metadata mismatch on deployed image and kubernetes (#28) by @thefirstarcher
- ci: Add possibility of preview of pr-s (#27) by @thefirstarcher
- ci: Renamed bot to be more verbose (#26) by @thefirstarcher
- chore(deps): bump node from 22-alpine to 26-alpine (#13) by @dependabot[bot]
- chore(deps-dev): bump the dev-dependencies group with 2 updates (#14) by @dependabot[bot]
- ci: sync main-protection ruleset with live state (#24) by @thefirstarcher
- ci(codeowners): move to team-based approach (#16) by @thefirstarcher
- ci: add Dependabot config for npm, docker, and github-actions (#12) by @thefirstarcher
- ci: pin third-party action SHAs and add artifact-metadata permission (#10) by @thefirstarcher
- ci(bot): mint per-job GitHub App token instead of using PAT (#9) by @thefirstarcher
- Ci fix/bump manifest (#8) by @thefirstarcher
- ci: Github pull requests hardening (#7) by @thefirstarcher
- ci(validation): Added validation pipeline (#6) by @thefirstarcher
- ci: Deployment stability (#5) by @thefirstarcher
- ci: Deployment to GH image registry (#4) by @thefirstarcher

### Contributors

- @merv1n34k: 37 commits
- @thefirstarcher: 16 commits
- @DmytroTarasenk0: 5 commits
- @dependabot[bot]: 2 commits

## [Unreleased]

### Added

- **Feedback forms:** an event defines the questions its adjudicator feedback asks (`/events/:eventId/feedback-questions`: integer, text, boolean or choice, with ranges, choices, required and counts-in-score). Feedback carries `answers`, checked against the form; with counting questions its score is the average of those answers. Adjudicator stats accept `?base=` as one extra vote. Events without a form keep the plain score.
- **Swagger UI:** Initialised OpenAPI documentation and interactive testing environment.
- **Iron speeches:** a ballot can mark one of an iron-person's two speeches `is_iron` (by default the later one); it counts for the team but stays out of the speaker standings, speaker stats and user stats. Room reads carry the flag. A speaker score may name `participant_id`, the team member who actually gave the speech, so an absent teammate is not credited.
- **Room prep end:** rooms carry `prep_ends_at`, when prep ends and the debate starts. The motion route accepts it, `PATCH /rooms/:roomId/prep` moves or clears it while the room is open, and room reads return it.

### Fixed

- **Speaker standings:** `/standings/calculated/speakers` totals are the plain sum of a speaker's speech scores; the place bonus (score x (1 + (N - rank) x 0.1)) is gone. Rows add `average_score` and `speeches`, and ties on the total sort by average.

## [1.3.1] - 2026-05-11

### Fixed

- **Routing:** Corrected casing in the `adminRoutes.js` filename to prevent environment-specific resolution errors.

### Added

- **Infrastructure:** Introduced a `Dockerfile` for containerised image building.
- **Dependencies:** Moved `sequelize-cli` to core dependencies to support automated database migrations in production containers.

## [1.3.0] - 2026-05-10

### Changed

- **Database Engine:** Migrated the core database dialect from MS SQL Server (`tedious`) to PostgreSQL (`pg`, `pg-hstore`).
- **Schema Types:** Converted MS SQL-specific `STRING("MAX")` definitions to PostgreSQL `TEXT` types.
- **Configuration:** Updated environment variables to standardise around PostgreSQL conventions (replaced `DB_SERVER` with `DB_HOST` and added `DB_PORT`).

## [1.2.1] - 2026-05-08

### Changed

- **Database Management:** Transitioned from `sequelize.sync()` to a formal Sequelize CLI migration and seeding pipeline for production readiness.
- **Module Imports:** Refactored controller and middleware imports to target the explicit `models/index.js`.

### Documentation

- **README:** Updated local setup instructions to reflect the new database migration and seeding commands.

## [1.2.0] - 2026-04-25

### Added

- **Motions Engine:** Introduced the `Motion` model and dedicated `/sessions/:sessionId/motion` nested routes.
- **Competitive Integrity:** Implemented backend redaction logic. If a motion is marked as `is_released: false`, the API intercepts standard user requests and strips the `motion_text` and `infoslide` to prevent early leaks, revealing them only when toggled by the Owner.
- **Type Validation:** Added strict controller-level validation for Holding creation, enforcing the `academic` or `personal` type distinction.

### Changed

- **Query Optimisation:** Refactored `getSessionRooms` and `getSessionTeams` to explicitly select attributes, removing redundant raw foreign-key IDs and dramatically reducing JSON payload sizes.
- **Session Context:** Read requests for nested session resources now automatically fetch and wrap the `session.name` in the payload for easier frontend rendering.

## [1.1.0] - 2026-04-22

### Added

- **JWT Authentication:** Implemented `jsonwebtoken` to securely sign and verify user sessions.
- **Nested Routers:** Introduced Express routers with `{ mergeParams: true }` to properly handle deeply nested relational endpoints.
- **Child Routes:** Added dedicated `teamRoutes.js`, `waitlistRoutes.js`, and `roomRoutes.js` to isolate domain logic.

### Changed

- **Authentication Pipeline:** Replaced the insecure custom `x-user-id` header with standard `Authorization: Bearer <token>` verification.
- **Database Schema Nomenclature:** Refactored `Club` to `Holding` and `Event` to `Session` across all controllers to natively support both academic societies and independent tournaments.
- **Route Restructuring:** Split the monolithic `eventRoutes.js` file into cleanly separated parent-child route files for better maintainability.
- **Middleware Logic:** Updated `restrictTo` RBAC middleware to accurately trace and verify ownership permissions based on the new `holding_id` and `session_id` architecture.

### Fixed

- Resolved variable collision bugs in the authentication middleware.
- Corrected payload casing and parameter extraction typos across various controllers.
