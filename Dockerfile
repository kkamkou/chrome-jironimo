FROM node:6

WORKDIR /opt

COPY package.json ./

RUN npm install

VOLUME ["/opt/app"]

ENTRYPOINT ["node", "node_modules/jake/bin/cli.js", "-f", "app/Jakefile.js"]
