
# Stage 1: Build environment
FROM node:18-alpine AS build

# Đặt thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies với legacy peer deps để tránh xung đột
RUN npm install --legacy-peer-deps

# Sao chép toàn bộ source code
COPY . .

# Build ứng dụng cho production
RUN npm run build

# Stage 2: Production environment với Nginx
FROM nginx:1.25-alpine AS production

# Sao chép file build từ stage trước và kiểm tra cấu trúc
COPY --from=build /app/dist/CheckScam-admin/browser /usr/share/nginx/html/

# Cấu hình nginx cho Angular SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Khởi động nginx
CMD ["nginx", "-g", "daemon off;"]