FROM node:22.18.0-alpine

WORKDIR /back
COPY . /back/

RUN apk update && apk add bash
RUN apk --no-cache add --virtual builds-deps build-base gcompat python3 make g++
RUN npm install
RUN npm rebuild better-sqlite3
RUN mkdir -p bbdd

EXPOSE 3000

CMD ["npm", "run", "dev"]
