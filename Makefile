# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: danjimen <danjimen@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/20 09:04:48 by danjimen,is       #+#    #+#              #
#    Updated: 2025/09/01 10:55:37 by danjimen         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

all: build

# Create HTTPS certs
certs:
	mkdir -p backend/certs frontend/certs
	openssl req -x509 -newkey rsa:4096 -keyout backend/certs/key.pem -out backend/certs/cert.pem -days 365 -nodes -subj "/CN=localhost"
	cp backend/certs/key.pem frontend/certs/key.pem
	cp backend/certs/cert.pem frontend/certs/cert.pem

# Construir los contenedores
build: certs
	docker compose build

# Levantar los contenedores
up:
	docker compose up

# Levantar los contenedores en segundo plano
up-detached:
	docker compose up -d

# Detener los contenedores
down:
	docker compose down

# Ver logs de los contenedores
logs:
	docker compose logs -f

# Reiniciar los contenedores
restart:
	docker compose down && docker compose up

# Limpiar contenedores detenidos y redes no utilizadas
clean:
	docker compose down --rmi none --volumes --remove-orphans

# Limpiar todo: contenedores, imágenes, volúmenes y redes no utilizadas
fclean:
	docker compose down --rmi all --volumes --remove-orphans

# Reconstruir todo desde cero
rebuild: fclean build