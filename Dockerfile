#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:22-bullseye-slim@sha256:bdd4d07d0320466d0720f916d752b0fa31314d53c06caad6efe85956e59ab966 as build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:e68bca20114b93f258d73d469ca0a5df0152b0fa73472dcf5c11a61d7bc6b814

LABEL license='SPDX-License-Identifier: Apache-2.0' \
      copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /usr/src/app/dist/openamtui /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80
