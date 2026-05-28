.PHONY: install install-frontend install-backend install-playwright-browsers \
        dev dev-frontend dev-backend \
        build \
        test test-backend test-frontend \
        docker-build docker-up docker-down docker-logs \
        clean \
        visual-report package-screenshots package-recordings package-artifacts clean-artifacts \
        demo

ARTIFACTS_DIR := artifacts
DEMO_DIR      := $(ARTIFACTS_DIR)/demo
DATE          := $(shell date +%Y%m%d-%H%M%S)

# ── Dependencies ─────────────────────────────────────────────────────────────

install: install-frontend install-backend

install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && pip install -r requirements.txt

install-playwright-browsers:
	cd frontend && npx playwright install --with-deps chromium

# ── Development ───────────────────────────────────────────────────────────────

dev:
	@echo "Starting backend (port 5000) and frontend (port 3000)..."
	@trap 'kill 0' EXIT; \
	(cd backend && python3 app.py) & \
	(cd frontend && npm run dev) & \
	wait

dev-backend:
	cd backend && python3 app.py

dev-frontend:
	cd frontend && npm run dev

# ── Build ─────────────────────────────────────────────────────────────────────

build:
	cd frontend && npm run build

# ── Tests ─────────────────────────────────────────────────────────────────────

test: test-backend test-frontend

test-backend:
	cd backend && python -m pytest tests/ -v

test-frontend:
	cd frontend && npm run test:ui

# ── Docker ────────────────────────────────────────────────────────────────────

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# ── Visual Testing Artifacts ──────────────────────────────────────────────────

visual-report: test-frontend
	cd frontend && npm run test:ui:report

package-screenshots:
	@mkdir -p $(ARTIFACTS_DIR)
	@if [ -d frontend/screenshots ]; then \
		tar czf $(ARTIFACTS_DIR)/screenshots-$(DATE).tar.gz -C frontend screenshots/; \
		echo "Packaged: $(ARTIFACTS_DIR)/screenshots-$(DATE).tar.gz"; \
	else \
		echo "No frontend/screenshots/ found — run 'make test-frontend' first."; \
	fi

package-recordings:
	@mkdir -p $(ARTIFACTS_DIR)
	@if find frontend/test-results -name "*.webm" -o -name "*.zip" 2>/dev/null | grep -q .; then \
		tar czf $(ARTIFACTS_DIR)/recordings-$(DATE).tar.gz \
			--exclude='.last-run.json' \
			-C frontend test-results/; \
		echo "Packaged: $(ARTIFACTS_DIR)/recordings-$(DATE).tar.gz"; \
	else \
		echo "No recordings found in frontend/test-results/ — run 'make test-frontend' first."; \
		echo "  If videos are missing, ensure ffmpeg is installed: sudo apt-get install -y ffmpeg"; \
		exit 1; \
	fi

package-artifacts: package-screenshots package-recordings

demo:
	@mkdir -p $(DEMO_DIR)
	cd frontend && npx playwright test tests/ui/demo.spec.js --output=test-results/demo
	@VIDEO=$$(find frontend/test-results/demo -name "*.webm" 2>/dev/null | head -1); \
	if [ -n "$$VIDEO" ]; then \
		cp "$$VIDEO" "$(DEMO_DIR)/demo.webm"; \
		echo "Demo video: $(DEMO_DIR)/demo.webm"; \
	else \
		echo "No demo video found. Ensure ffmpeg is installed: sudo apt-get install -y ffmpeg"; \
		exit 1; \
	fi

clean-artifacts:
	rm -rf $(ARTIFACTS_DIR) frontend/screenshots frontend/test-results frontend/playwright-report

# ── Clean ─────────────────────────────────────────────────────────────────────

clean:
	rm -rf frontend/node_modules frontend/dist
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -name "*.pyc" -delete 2>/dev/null || true
	rm -f backend/cats.db
