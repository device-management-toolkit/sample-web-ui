#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:24-bullseye-slim@sha256:139c1bbc5dbcd10c1e26d7ae2911d7de13b3e9d03497b1da2d404b88f3f4e2d7 AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:b947b2630c97622793113555e13332eec85bdc7a0ac6ab697159af78942bb856

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /usr/src/app/dist/samplewebui/browser /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
