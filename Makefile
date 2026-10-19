.PHONY: setup dev build test test-all lint fmt clean FORCE

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

test-all: test

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
