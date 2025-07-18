FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration=production

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist/CheckScam-admin/browser ./dist

# Dùng 'serve' để chắc chắn SPA routing work
RUN npm install -g serve

EXPOSE 8080

# Dùng serve thay vì http-server
CMD ["serve", "-s", "dist", "-l", "8080"]