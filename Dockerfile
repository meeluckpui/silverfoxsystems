FROM apify/actor-node:20

COPY package*.json ./
RUN npm --quiet set progress=false \
    && npm install --omit=dev --no-optional

COPY . ./

CMD ["npm", "start"]
