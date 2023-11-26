FROM node:lts-alpine3.18

RUN ["npm", "i", "-g", "pnpm"]

WORKDIR /usr/app

COPY ./package.json .

RUN ["pnpm", "i"]

COPY . .

RUN ["pnpm", "build"]

CMD ["pnpm", "start"]