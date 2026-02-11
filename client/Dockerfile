# ======================================
# DEV STAGE (Vite Hot Reload)
# ======================================
FROM node:20-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]


# ======================================
# BUILD STAGE
# ======================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build


# ======================================
# PRODUCTION STAGE
# ======================================
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80