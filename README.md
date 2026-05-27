# Cat Gallery

A full-stack app: Flask REST API + React frontend for browsing and managing random cat images.

## Structure

```
react-test-project/
├── backend/
│   ├── app.py               # Flask REST API
│   ├── requirements.txt
│   └── tests/
│       ├── conftest.py
│       └── test_api.py      # pytest API tests
├── frontend/
│   ├── src/                 # React (Vite) app
│   ├── tests/ui/
│   │   └── cat-gallery.spec.js  # Playwright UI tests
│   ├── playwright.config.js
│   └── package.json
└── VisualTesting.md         # Plan for screenshot/video recording
```

## Quick start

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py          # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # runs on http://localhost:3000
```

## Running tests

### Python API tests

```bash
cd backend
pytest tests/ -v
```

### Playwright UI tests (headless)

```bash
cd frontend
npm run test:ui
```

### Playwright UI tests (headed — watch the browser)

```bash
cd frontend
npm run test:ui:headed
```

### View HTML test report

```bash
cd frontend
npm run test:ui:report
```

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/cats` | List all cats (newest first) |
| `POST` | `/api/cats` | Create a cat — body: `{ "name": "..." }` |
| `GET` | `/api/cats/:id` | Get a single cat |
| `DELETE` | `/api/cats/:id` | Delete a cat |
