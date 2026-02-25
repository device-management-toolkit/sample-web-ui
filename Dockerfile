#*********************************************************************
# Copyright (c) Intel Corporation 2021
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************/
### STAGE 1: Build ###
FROM node:25-bullseye-slim@sha256:1f4b61d575d90158222fbbc8ad1e2e41020e051e0c495eddf7845378e319db77 AS build
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY}
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN echo "HTTP_PROXY=${HTTP_PROXY}" \ 
 && echo "HTTPS_PROXY=${HTTPS_PROXY}" \ 
 && echo "NO_PROXY=${NO_PROXY}" \ 
 && if [ -n "$HTTP_PROXY" ]; then npm config set proxy "$HTTP_PROXY"; fi \ 
 && if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi \ 
 && echo "npm proxy=$(npm config get proxy)" \ 
 && echo "npm https-proxy=$(npm config get https-proxy)" \ 
 && npm ci
COPY . .
RUN npm run build -- --configuration=production

### STAGE 2: Run ###
FROM nginx:mainline-alpine-slim@sha256:a716a2895ddba4fa7fca05e1003579f76d3d304932781426a211bc72b51f0c4e
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY}

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2021: Intel'

RUN apk update && apk upgrade --no-cache

COPY --from=build /usr/src/app/dist/samplewebui/browser /usr/share/nginx/html
COPY --from=build /usr/src/app/init.sh /docker-entrypoint.d/init.sh
EXPOSE 80