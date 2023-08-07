FROM node:14
WORKDIR /home/andro/datadump/untitled
COPY package.json ./
COPY package-lock.json ./
COPY webApp.js ./
COPY ../Untitled-Game/static ./static
COPY ../Untitled-Game/Templates ./Templates
RUN npm ci
EXPOSE 8000
EXPOSE 8001
CMD ["node", "webApp.js"]
