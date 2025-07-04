# Giai đoạn build
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json và package-lock.json trước
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build ứng dụng Angular
RUN npm run build -- --configuration=production

# Giai đoạn chạy
FROM node:18-alpine

WORKDIR /app

# Copy các file đã build từ giai đoạn trước
COPY --from=build /app/dist ./dist

# Cài đặt http-server để phục vụ ứng dụng
RUN npm install -g http-server

# Mở cổng 8080
EXPOSE 8080

# Khởi động http-server
CMD ["http-server", "dist", "-p", "8080"]
