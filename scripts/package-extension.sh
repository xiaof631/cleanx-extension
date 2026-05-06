#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('${ROOT_DIR}/package.json').version")"
ZIP_PATH="${ROOT_DIR}/cleanx-extension-${VERSION}.zip"

cd "${ROOT_DIR}"
npm run build
rm -f "${ZIP_PATH}"
cd "${ROOT_DIR}/dist"
zip -r "${ZIP_PATH}" .

echo "Created ${ZIP_PATH}"
