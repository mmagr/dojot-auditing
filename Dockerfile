from node:8

RUN mkdir -p /opt/audit
WORKDIR /opt/audit
ADD package.json package-lock.json /opt/audit/
RUN npm install
ADD . .
CMD ["node", "index.js"]
