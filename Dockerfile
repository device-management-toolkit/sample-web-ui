#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:26-bullseye-slim@sha256:ce69d6017624735163d253581f6bfa3c8bf6c1eb1640ca71393be122c0716838 AS build
ARG BUILD_CONFIGURATION=production

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=${BUILD_CONFIGURATION} \
 && if [ -d dist/samplewebui/browser ]; then \
      mv dist/samplewebui/browser /artifact; \
    elif [ -d ui/browser ]; then \
      mv ui/browser /artifact; \
    else \
      echo "build output not found at dist/samplewebui/browser or ui/browser" >&2; exit 1; \
    fi

### STAGE 2: Build the Brotli dynamic modules ###
# The official nginx image ships without ngx_brotli, so compile it here. The
# base image is built --with-compat, which lets a module compiled from matching
# nginx sources be loaded dynamically (see load_module below) — no need to
# rebuild nginx itself. Using the exact same base image digest as the runtime
# stage guarantees NGINX_VERSION and build flags match; a mismatch makes nginx
# refuse to load the module at startup.
FROM nginx:mainline-alpine-slim@sha256:ebd058041a732a2b2dc0b606e34572dd8e0034de6a4aa4d50d8c13a240ac6005 AS brotli

# brotli-dev supplies libbrotlienc/libbrotlicommon, which ngx_brotli links
# against. Without it the module compiles but fails at link time with
# "cannot find -lbrotlienc".
RUN apk add --no-cache --virtual .brotli-build \
      build-base cmake git pcre2-dev zlib-dev openssl-dev linux-headers brotli-dev \
 && git clone --depth 1 --recurse-submodules \
      https://github.com/google/ngx_brotli.git /usr/src/ngx_brotli \
 # Sourced from the GitHub mirror rather than nginx.org/download: both carry
 # identical release sources, but some corporate proxies allow github.com while
 # blocking nginx.org. The release-* tag pins the exact runtime nginx version.
 && git clone --depth 1 -b "release-${NGINX_VERSION}" \
      https://github.com/nginx/nginx.git "/usr/src/nginx-${NGINX_VERSION}" \
 && cd "/usr/src/nginx-${NGINX_VERSION}" \
 # `auto/configure`, not `./configure`: the git tree has no top-level configure
 # script (release tarballs generate one), so invoke it at its real path.
 #
 # Reuse the base image's exact configure arguments so the module is built with
 # matching flags — a dynamic module compiled with different cc/ld options can
 # fail to load or misbehave at runtime. `eval` is required because those
 # arguments contain quoted values with embedded spaces.
 && eval auto/configure --with-compat \
      --add-dynamic-module=/usr/src/ngx_brotli \
      "$(nginx -V 2>&1 | sed -n 's/^configure arguments: //p')" \
 && make -j"$(nproc)" modules \
 && mkdir -p /modules \
 && cp objs/ngx_http_brotli_filter_module.so objs/ngx_http_brotli_static_module.so /modules/

### STAGE 3: Run ###
FROM nginx:mainline-alpine-slim@sha256:ebd058041a732a2b2dc0b606e34572dd8e0034de6a4aa4d50d8c13a240ac6005

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

# brotli-libs provides the runtime libbrotlienc/libbrotlicommon that the
# ngx_brotli module below links against dynamically.
RUN apk update && apk upgrade --no-cache \
 && apk add --no-cache brotli-libs

# Brotli filter modules + the load_module directives they need. Must be loaded
# from the main context, so they are prepended to nginx.conf rather than
# dropped into conf.d (which is included inside the http block).
COPY --from=brotli /modules/ngx_http_brotli_filter_module.so \
                   /modules/ngx_http_brotli_static_module.so \
                   /usr/lib/nginx/modules/
COPY brotli.conf /etc/nginx/conf.d/brotli.conf
RUN sed -i '1i load_module modules/ngx_http_brotli_filter_module.so;\nload_module modules/ngx_http_brotli_static_module.so;' \
      /etc/nginx/nginx.conf \
 && nginx -t

# The server config the app actually needs: gzip fallback, immutable caching
# for hashed assets, and the SPA fallback that keeps deep links at 200. A
# deployment is free to bind-mount over this path — docker-compose.yml does
# exactly that, with the repo-root nginx.conf — but baking a copy in means a
# bare `docker run` of this image is correctly configured rather than falling
# back to nginx's stock default.conf, which serves the app with no
# compression, no caching, and a 404 on every deep link.
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /artifact /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
RUN nginx -t
EXPOSE 80
