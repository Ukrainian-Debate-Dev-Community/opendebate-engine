# What `make release` releases (scripts/release reads these); main,
# nightly and the tags live in the org repo (remote upstream in a fork)
RELEASE_NAME      = opendebate-engine
RELEASE_REPO      = Ukrainian-Debate-Dev-Community/opendebate-engine
RELEASE_CI        = validate.yml
RELEASE_FILES     = package.json package-lock.json
RELEASE_CHANGELOG = docs/CHANGELOG.md
RELEASE_ARTIFACT  = ghcr.io/ukrainian-debate-dev-community/opendebate-engine:v{version}, :X.Y and :latest (deploy workflow)

.PHONY: setup dev build test test-all lint fmt clean release FORCE

# Targets named dev:<x> run something locally for development. GNU make
# 3.81 keeps the backslash of an escaped colon in .PHONY and
# prerequisite lists, so these depend on FORCE instead and are called
# through $(MAKE).
FORCE:

# ---------------------------------------------------------------
# Standard targets
# ---------------------------------------------------------------

setup:
	npm ci

# make dev = make dev:run
dev:
	@$(MAKE) --no-print-directory dev:run

# The production image, locally (needs docker running)
build:
	docker build -t opendebate-engine:local .

# Needs a PostgreSQL with the test database: DB_HOST, DB_PORT, DB_USER,
# DB_PASSWORD, DB_TEST, JWT_SECRET and JWT_EXPIRES_IN come from .env
# (see .env.example) or the environment
test:
	npm test

# The tests and the release script's own checks
test-all: test
	python3 scripts/release --self-test

lint:
	npm run lint

fmt:
	npx eslint . --fix

clean:
	rm -rf coverage

# ---------------------------------------------------------------
# Local development
# ---------------------------------------------------------------

# The API with reload on change (nodemon), configured by .env
dev\:run: FORCE
	npm run dev

# ---------------------------------------------------------------
# Releases: main moves only here, by fast-forward to a release commit
# on nightly. scripts/release (the same in every repo) does it all:
#   make release BUMP=patch|minor|major   (or VERSION=X.Y.Z)
#   make release BUMP=patch DRY_RUN=1     preview, changes nothing
#   make release RESUME=1                 finish an interrupted release
# SINCE=<ref> takes the notes from <ref> instead of the last tag.
# ---------------------------------------------------------------

release:
	@python3 scripts/release --name '$(RELEASE_NAME)' --repo '$(RELEASE_REPO)' \
		--ci '$(RELEASE_CI)' --files '$(RELEASE_FILES)' --changelog '$(RELEASE_CHANGELOG)' \
		--artifact '$(RELEASE_ARTIFACT)' $(if $(BUMP),--bump '$(BUMP)') \
		$(if $(VERSION),--version '$(VERSION)') $(if $(SINCE),--since '$(SINCE)') \
		$(if $(DRY_RUN),--dry-run) $(if $(RESUME),--resume)
