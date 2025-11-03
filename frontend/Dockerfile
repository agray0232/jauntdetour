FROM node:lts-alpine

ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN apk add --no-cache bash
RUN npm install -g npm@11.4.2
RUN npm ci --verbose
RUN npm install -g serve

COPY . .

RUN npm run build

EXPOSE 3000
RUN chown -R node /usr/src/app
USER node
CMD ["serve", "-s", "build"]
