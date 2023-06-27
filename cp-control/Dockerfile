# build environment
FROM node:18-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent
COPY . ./
RUN npm run build

# production environment
FROM node:18-alpine
WORKDIR /app
COPY ./deploy .
RUN npm install
COPY --from=build /app/dist ./build
EXPOSE 80
EXPOSE 443
CMD ["npm", "start"]
