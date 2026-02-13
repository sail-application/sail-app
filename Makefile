# Makefile — SAIL development shortcuts
#
# Provides simple make targets for common development tasks.
# Run `make help` (or just `make`) to see all available targets.
#
# Usage:
#   make dev          Start the dev server with Turbopack
#   make build        Run a production build
#   make verify       Docker clean-build verification
#   make docker-up    Start the full local stack (app + db)

.PHONY: dev build lint test verify docker-up docker-down clean

dev:          ## Start dev server with Turbopack
	npm run dev

build:        ## Production build
	npm run build

lint:         ## Run ESLint
	npm run lint

test:         ## Run tests
	npm run test

verify:       ## Docker clean-build verification
	docker build -f docker/Dockerfile -t sail-verify . && echo "✓ BUILD OK"

docker-up:    ## Start full local stack
	docker compose -f docker/docker-compose.yml up -d

docker-down:  ## Stop local stack
	docker compose -f docker/docker-compose.yml down

clean:        ## Remove build artifacts
	rm -rf .next node_modules
