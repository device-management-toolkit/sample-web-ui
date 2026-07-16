#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:26-bullseye-slim@sha256:1b1f313a1606186f4fc3415ddf9c249f937aff1f9739834b9cfddba460f0b16b AS build
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
FROM nginx:mainline-alpine-slim@sha256:8763397d71453fccb4a2613ccfd89aa62e1d731d618b1eaa8e14631539a3a65b

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /artifact /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
