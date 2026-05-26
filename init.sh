#!/bin/sh
#*********************************************************************
# Copyright (c) Intel Corporation 2026
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/

# Fail fast if the built bundle isn't where we expect it.
if ! ls /usr/share/nginx/html/*.js >/dev/null 2>&1; then
  echo "init.sh: error — no JS files found in /usr/share/nginx/html; cannot apply runtime config" >&2
  exit 1
fi

sed -i \
-e "s|##RPS_SERVER##|$RPS_SERVER|g" \
-e "s|##MPS_SERVER##|$MPS_SERVER|g" \
-e "s|##CONSOLE_SERVER_API##|$CONSOLE_SERVER_API|g" \
-e "s|##VAULT_SERVER##|$VAULT_SERVER|g" \
-e "s|##CLIENTID##|$CLIENTID|g" \
-e "s|##ISSUER##|$ISSUER|g" \
-e "s|##REDIRECTURI##|$REDIRECTURI|g" \
-e "s|##SCOPE##|$SCOPE|g" \
 /usr/share/nginx/html/*.js

# AOT constant-folds useOAuth at build time; patch the minified token directly.
if [ "$AUTH_MODE_ENABLED" = "true" ]; then
  if ! grep -q 'useOAuth:!1' /usr/share/nginx/html/*.js; then
    echo "init.sh: warning — 'useOAuth:!1' not found; auth mode may not be enabled (minifier output may have changed)" >&2
  fi
  sed -i 's|useOAuth:!1|useOAuth:!0|g' /usr/share/nginx/html/*.js
fi

# requireHttps defaults on; opt out via REQUIRE_HTTPS=false (token patched directly).
if [ "$REQUIRE_HTTPS" = "false" ]; then
  if ! grep -q 'requireHttps:!0' /usr/share/nginx/html/*.js; then
    echo "init.sh: warning — 'requireHttps:!0' not found; requireHttps may still be enabled (minifier output may have changed)" >&2
  fi
  sed -i 's|requireHttps:!0|requireHttps:!1|g' /usr/share/nginx/html/*.js
fi
