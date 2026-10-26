# Repository guide for coding agents

## Project overview

LabelFlow AI is a web application with a React frontend in `web/` and a Django REST Framework backend in `api/`.

```text
web/   React 19 + TypeScript + Vite + Tailwind CSS
api/   Django + Django REST Framework, managed with uv
```

The backend is an early Django project skeleton. Its Django project package is `config/`, its `manage.py` is in `api/`, and DRF is installed. Add domain-specific Django apps under `api/` as needed; register each app in `INSTALLED_APPS` and include its URL routes through `config/urls.py`.

## Backend workflow

- Run backend commands from `api/`.
- Use `uv` to manage Python and dependencies. Add dependencies with `uv add <package>`; do not use global `pip` installs.
- Use `uv run <command>` for project commands, for example `uv run python manage.py runserver` and `uv run python manage.py migrate`. Activating `api/.venv` is optional.
- Keep `pyproject.toml` and `uv.lock` in sync when changing dependencies.
- The local database is SQLite unless the task explicitly calls for another database. Do not commit the local database file.
- Implement API endpoints with DRF serializers, views/viewsets, and URL routing. Keep domain logic in the relevant app rather than accumulating it in `config/`.

## Configuration and secrets

- Local development uses `python-dotenv` to load `api/.env` from `api/config/settings.py`. The `.env` file is gitignored; `.env.example` documents the required variables.
- Shell and deployment environment variables take precedence over values in `api/.env`.
- Do not add another environment-file library or change this setup unless the user requests it.
- Read required settings from `os.environ` in Django settings; parse booleans and comma-separated lists explicitly.
- Never commit real secrets, credentials, or production configuration. Keep `DEBUG` enabled only for local development.

## Frontend workflow

- The frontend lives in `web/`; use its existing React, TypeScript, Vite, and Tailwind setup.
- Run frontend commands from `web/` using the scripts in `web/package.json` (for example, `npm run dev` or `npm run build`).
- Keep frontend API calls aligned with routes and response shapes implemented by the backend.

## General working conventions

- Read the relevant files before changing them and preserve unrelated user changes.
- Keep changes scoped to the requested feature and follow the existing conventions in the affected area.
- Do not add dependencies when the existing stack can handle the task.
- Do not run tests or other verification commands unless the user asks for verification.

Use `prd.md` file for the project context.

## Formatting

- Run `./scripts/format-all.sh` from the repository root to format the whole project. Prettier handles frontend files and docs; Ruff handles Python files.
- Run `cd api && uv run pre-commit install` once per clone to enable automatic formatting before commits. This installs one repository-wide hook at `.git/hooks/pre-commit`; the hook formats both `web/` and `api/` according to file type.
- The pre-commit hook only formats staged supported files. If it changes a file, stage the formatted version and retry the commit.
