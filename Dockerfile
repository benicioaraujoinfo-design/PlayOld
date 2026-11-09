FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm --prefix backend install --omit=dev
ENV NODE_ENV=production
CMD ["npm", "--prefix", "backend", "start"]
