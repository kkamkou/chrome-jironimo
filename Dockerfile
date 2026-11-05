FROM node:26

WORKDIR /opt

COPY package.json ./

RUN npm install

VOLUME ["/opt/app"]

WORKDIR /opt/app

ENTRYPOINT ["npm", "run", "build"]
