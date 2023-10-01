#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:18@sha256:c85dc4392f44f5de1d0d72dd20a088a542734445f99bed7aa8ac895c706d370d AS build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:253074a844e9507b7664a9a633086c33545bc3bf1d01aeb59acce0ac424a689d

LABEL license='SPDX-License-Identifier: Apache-2.0' \
      copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /usr/src/app/dist/openamtui /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
