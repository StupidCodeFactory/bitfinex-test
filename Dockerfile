FROM node:18-bullseye

WORKDIR /usr/src/app

COPY package.json yarn.lock .

RUN yarn install
COPY . .
RUN yarn build

CMD ["node", "dist/index.js"]
