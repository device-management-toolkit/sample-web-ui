#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:25-bullseye-slim@sha256:1f4b61d575d90158222fbbc8ad1e2e41020e051e0c495eddf7845378e319db77 AS build
ARG BUILD_CONFIG=enterprise
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=$BUILD_CONFIG
# Normalize output to a known location (enterprise outputs to ui/, production to dist/samplewebui/)
RUN mkdir -p /build-output && \
    if [ -d "ui/browser" ]; then cp -r ui/browser/* /build-output/; \
    elif [ -d "dist/samplewebui/browser" ]; then cp -r dist/samplewebui/browser/* /build-output/; fi

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:a716a2895ddba4fa7fca05e1003579f76d3d304932781426a211bc72b51f0c4e

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /build-output /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
