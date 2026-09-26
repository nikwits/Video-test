#!/bin/bash
# Installs the Remotion project's dependencies when a Claude Code on the web
# session starts, so stills and renders work straight away.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# Playwright's Chromium is pre-installed in the container; never download it.
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# npm install (not npm ci) so the cached container state is reused.
npm install --no-audit --no-fund
