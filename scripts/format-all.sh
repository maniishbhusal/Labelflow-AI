#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
prettier="$repo_root/web/node_modules/.bin/prettier"

if [ ! -x "$prettier" ]; then
  echo "Prettier is not installed. Run 'npm install' from web/." >&2
  exit 1
fi

"$prettier" --write "$repo_root"
uv run --project "$repo_root/api" ruff format "$repo_root/api"
