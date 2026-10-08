#!/bin/bash
# ==============================================================================
# Script to bump the application version across version.json, package.json,
# js/version.js, and index.html.
# Usage: ./bump-version.sh [patch|minor|major|<specific-version>]
# Default: patch (e.g. 1.0.1 -> 1.0.2)
# ==============================================================================

set -e

BUMP_TYPE="${1:-patch}"

# Read current version from version.json
CURRENT_VER=$(grep '"version"' version.json | head -1 | sed -E 's/.*"version": "([^"]+)".*/\1/')

if [ -z "$CURRENT_VER" ]; then
  echo "Error: Could not read current version from version.json"
  exit 1
fi

echo "Current version: $CURRENT_VER"

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VER"
MAJOR=${MAJOR:-1}
MINOR=${MINOR:-0}
PATCH=${PATCH:-0}

if [ "$BUMP_TYPE" = "major" ]; then
  MAJOR=$((MAJOR + 1))
  MINOR=0
  PATCH=0
  NEW_VER="$MAJOR.$MINOR.$PATCH"
elif [ "$BUMP_TYPE" = "minor" ]; then
  MINOR=$((MINOR + 1))
  PATCH=0
  NEW_VER="$MAJOR.$MINOR.$PATCH"
elif [ "$BUMP_TYPE" = "patch" ]; then
  PATCH=$((PATCH + 1))
  NEW_VER="$MAJOR.$MINOR.$PATCH"
else
  # Direct version supplied
  NEW_VER=$(echo "$BUMP_TYPE" | sed 's/^v//i')
fi

echo "New version: $NEW_VER (V$NEW_VER)"

# 1. Update version.json
sed -i '' -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VER\"/" version.json

# 2. Update package.json
sed -i '' -E "s/\"version\": \"[^\"]+\"/\"version\": \"$NEW_VER\"/" package.json

# 3. Update js/version.js DEFAULT_VERSION
sed -i '' -E "s/const DEFAULT_VERSION = 'V[^']+';/const DEFAULT_VERSION = 'V$NEW_VER';/" js/version.js

# 4. Update index.html header version pill
sed -i '' -E "s/id=\"header-version-pill\">V[^<]+</id=\"header-version-pill\">V$NEW_VER</" index.html
sed -i '' -E "s/id=\"info-version-display\">V[^<]+</id=\"info-version-display\">V$NEW_VER</" index.html

echo "Successfully bumped application version to V$NEW_VER!"
