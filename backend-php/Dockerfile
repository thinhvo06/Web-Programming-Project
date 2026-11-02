FROM php:8.2-apache

# Cài đặt extension pdo_mysql để kết nối CSDL MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Bật mod_rewrite của Apache
RUN a2enmod rewrite

# Copy toàn bộ mã nguồn PHP vào DocumentRoot
COPY . /var/www/html/

# Phân quyền www-data cho các thư mục ghi file
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
