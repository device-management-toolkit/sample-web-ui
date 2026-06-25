#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:26-bullseye-slim@sha256:37776d152c2d3e24561784c91c505d2e6d4b3dcccf8fa77d59c0ad8218ddef28 AS build
ARG BUILD_CONFIGURATION=production

WORKDIR /usr/src/app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --ignore-scripts
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
FROM nginx:mainline-alpine-slim@sha256:22c50af94b90d8b89d12fb7c36cdefb82f40b243f6d605e8db839ca87a2684b2

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /artifact /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
