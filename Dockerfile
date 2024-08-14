#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:22-bullseye-slim@sha256:a4b9a4773f239be06956f24fdf0b371ef87da3ad2d3eb877669254da947fa8b2 as build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:a529900d9252ce5d04531a4a594f93736dbbe3ec155a692d10484be82aaa159a

LABEL license='SPDX-License-Identifier: Apache-2.0' \
      copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /usr/src/app/dist/openamtui /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
