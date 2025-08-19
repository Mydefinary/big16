#FROM node:20-alpine AS build
#WORKDIR /app
#COPY package*.json ./
#RUN npm ci
#COPY . .
#RUN npm run build

#FROM nginx:1.27-alpine
#COPY nginx.conf /etc/nginx/conf.d/default.conf
#COPY --from=build /app/build /usr/share/nginx/html/webtoon-hl
#HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1

# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG REACT_APP_HL_API=/api
ENV REACT_APP_HL_API=$REACT_APP_HL_API

RUN npm run build

# runtime stage
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



