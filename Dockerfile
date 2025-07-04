FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/CheckScam-admin/browser ./dist
RUN npm install -g http-server
EXPOSE 8080
CMD ["http-server", "dist", "-p", "8080", "--push-state"]
