# opendebate-engine

The OpenDebate engine: a RESTful API built with Node.js and Express to manage debate clubs, tournaments, dynamic matchmaking, and speaker statistics.

## Features

- **Role-Based Access Control (RBAC):** Custom, highly secure middleware handling Admins, Holding (Tournament/Club) Owners, Judges, and standard Debaters.
- **Dynamic Matchmaking Pipeline:** Waitlist registration and team formation. Transactional room generation.
- **Tournament Integrity:** Backend redaction logic securely hiding debate motions from standard users until officially released.
- **Tabulation & Scoring:** Secure ballot submission system with data integrity checks and locked states for finished rooms.
- **Statistical Engine:** Native SQL aggregation to generate granular user dashboards (win rates, positional mastery, partner synergy).
- **Soft Deletion:** Safe data archiving to preserve historical tournament records without breaking foreign key constraints.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Security:** bcryptjs (password hashing), JSON Web Tokens (JWT) for secure authentication.

## Local Setup & Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Ukrainian-Debate-Dev-Community/opendebate-engine.git
   cd opendebate-engine
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the provided example environment file and fill in your local PostgreSQL credentials and JWT secrets:

   ```bash
   cp .env.example .env
   ```

4. **Database Setup:**

   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

## Make targets

The same names as in the other opendebate repos:

| Command | Does |
|---|---|
| `make setup` | `npm ci` |
| `make test` / `make test-all` | the Jest suite; needs PostgreSQL and the `DB_*` and `JWT_*` settings from `.env` |
| `make lint` / `make fmt` | ESLint / ESLint with `--fix` |
| `make build` | the production image as `opendebate-engine:local` (Docker needed) |
| `make clean` | remove test coverage output |
| `make dev:run` (or `make dev`) | the API with reload on change (`npm run dev`) |
| `make release BUMP=patch\|minor\|major` | a release, see below |

## Authentication

The API utilises JSON Web Tokens (JWT) for stateless, secure authentication.
For all protected routes, you must include your token in the request headers:

- `Authorization: Bearer <your_jwt_token_here>`

## API Documentation

A full Postman collection containing all available endpoints, request bodies, and parameters is included in this repository.

- Navigate to the `postman/` folder and import the `debates.postman_collection.json` file into Postman.
  > Note: The collection is configured to automatically capture and apply the JWT Bearer token globally upon a successful login request.

### Core Domain Routes

- `/api/users` - User registration, authentication, profile management, and statistics.
- `/api/holdings` - Management of workspaces (Academic Clubs or Personal Tournament spaces) and their Owners.
- `/api/sessions` - Management of time-blocks (Evenings Meeting or Tournament Rounds).
- `/api/sessions/:sessionId/*` - Nested routers handling domain-specific logic for `teams`, `waitlists`, `rooms`, and `motion`.
- `/api/admins/grant` - Simple route to grant Administrator status to another user.

## Branches and releases

- `nightly` is the default branch and the only target for pull requests
  (squash-merged, `validate` must pass). Branches live on forks; pull
  requests go to the org repo.
- `main` moves only on a release, by fast-forward to the release commit.
- Versions follow [Semantic Versioning](https://semver.org/) and are the
  git tags `vX.Y.Z`. A release, from a clean `nightly` equal to the org's
  `nightly` (the `upstream` remote in a fork) whose `validate` run is green:

  ```sh
  make release BUMP=patch|minor|major   # or VERSION=X.Y.Z
  make release BUMP=minor DRY_RUN=1     # preview the version and notes
  ```

  It shows the next version and the release notes (from the squash-merged
  pull request titles since the last tag) and asks you to type
  `opendebate-engine:vX.Y.Z`. Then it writes the version into
  `package.json` and the root entries of `package-lock.json`, prepends the
  notes to `docs/CHANGELOG.md`, commits
  `chore(release): opendebate-engine vX.Y.Z` on `nightly` and pushes it to
  the org repo, waits for `validate` on that commit, fast-forwards `main`
  to it, pushes the annotated tag and publishes the GitHub release. If a
  step fails after the commit, `make release RESUME=1` finishes it.
- The tag publishes `ghcr.io/<owner>/opendebate-engine:vX.Y.Z`, `:X.Y`
  and `:latest`; the server pins `opendebate-engine:vX.Y.Z`. Every push to
  `main` also publishes `:main` and `:sha-<short>` for testing; those are
  not releases.
- `.github/rulesets/` holds the two live rulesets, `nightly` and `main`.

## License

Released under the [MIT License](LICENSE).
