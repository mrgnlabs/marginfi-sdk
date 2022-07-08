FROM node:16-alpine

ARG package_name
ENV PACKAGE_NAME ${package_name}

WORKDIR /app

RUN test -d 

COPY packages/marginfi-client ./packages/marginfi-client
COPY packages/$package_name ./packages/$package_name
COPY lerna.json ./lerna.json
COPY package.json ./package.json
COPY tsconfig.json ./tsconfig.json

RUN yarn
RUN yarn build

WORKDIR /app/packages/$package_name

CMD ["yarn", "start"]
