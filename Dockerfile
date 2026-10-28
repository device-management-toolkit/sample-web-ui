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

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:ebd058041a732a2b2dc0b606e34572dd8e0034de6a4aa4d50d8c13a240ac6005

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

# The server config the app actually needs: gzip compression, immutable caching
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
