FROM google/nodejs
WORKDIR /opt
COPY package.json ./
RUN npm install
VOLUME ["/opt/app"]
