#!/usr/bin/env bash
# Builds the portfolio's generated files:
#   app.js      — app.jsx compiled to plain JS (the site loads no Babel at runtime)
#   index.html  — <noscript> SEO fallback refreshed from content.js
#
# Run this after editing app.jsx or content.js:  ./build.sh
#
# Requires macOS (uses osascript). The Babel compiler is cached in .cache/
# after the first run, so subsequent builds work offline.
set -eu
cd "$(dirname "$0")"

BABEL=".cache/babel.min.js"
if [ ! -f "$BABEL" ]; then
  echo "Fetching the Babel compiler (one-time, ~3 MB)…"
  mkdir -p .cache
  curl -fsSL "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" -o "$BABEL"
fi

echo "Building…"
osascript -l JavaScript build.tool.js
echo "Done."
