FROM node:12.19 as builder

ARG RPS_SERVER=localhost
ARG RPS_WEB_PORT=8081
ARG MPS_SERVER=localhost
ARG MPS_WEB_PORT=3000

ENV REACT_APP_RPS_SERVER=${RPS_SERVER}
ENV REACT_APP_RPS_WEB_PORT=${RPS_WEB_PORT}
ENV REACT_APP_MPS_SERVER=${MPS_SERVER}
ENV REACT_APP_MPS_WEB_PORT=${MPS_WEB_PORT}

WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*","./"]
RUN npm ci 
COPY . .
#RUN [ "npm","start" ]
RUN npm run build
FROM nginx:latest
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

