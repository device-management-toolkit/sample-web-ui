#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:25-bullseye-slim@sha256:d4127ff3b5d336cb963c12ed4f76a7334e169e0223469b67a3dbaa4d632f5c10 AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:e619c9c9b546c23ee47f617588523d2445cd3137e3037d07299dadfc767b3eb8

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /usr/src/app/dist/samplewebui/browser /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80