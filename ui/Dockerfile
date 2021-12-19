FROM node:17-alpine as build

LABEL author="Selcuk SERT"
LABEL mail="selcuk.sert@gmail.com"
LABEL version="1.0"
LABEL description="Builder image for UI"

WORKDIR /app

COPY package.json ./
COPY webpack.config.js ./
COPY index.html ./
COPY src/ ./src

RUN yarn install && yarn build

FROM nginx

EXPOSE 8080

COPY config/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
