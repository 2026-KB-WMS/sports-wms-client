FROM node:20-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:20-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
# VITE_* 값은 빌드 때 번들에 들어간다. --build-arg로 주거나, 비워 두면 복사된 .env 값을 쓴다.
ARG VITE_KAKAO_MAP_KEY
RUN if [ -z "$VITE_KAKAO_MAP_KEY" ]; then unset VITE_KAKAO_MAP_KEY; fi; npm run build

FROM node:20-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]