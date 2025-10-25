# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: danjimen <danjimen@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/20 09:04:48 by danjimen,is       #+#    #+#              #
#    Updated: 2025/10/25 03:37:50 by danjimen         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# ===== 🎨 Colores =====
RESET   = \033[0m
BOLD    = \033[1m
DIM     = \033[2m
RED     = \033[31m
GREEN   = \033[32m
YELLOW  = \033[33m
BLUE    = \033[34m
MAGENTA = \033[35m
CYAN    = \033[36m
WHITE   = \033[37m

all: build

# Create HTTPS certs
#certs:
#	@echo "$(CYAN)🔐 Regenerando certificados...$(RESET)"
#	@rm -f backend/certs/*.pem frontend/certs/*.pem
# 	@mkdir -p backend/certs frontend/certs
# 	@IP_ADDR=$$(hostname -I | awk '{print $$1}') ; \
# 	echo "$(YELLOW)🌐 Generando certificado para IP $(BOLD)$$IP_ADDR$(RESET)" ; \
# 	openssl req -x509 -newkey rsa:4096 -nodes \
# 		-keyout backend/certs/key.pem \
# 		-out backend/certs/cert.pem \
# 		-days 365 \
# 		-subj "/CN=localhost" \
# 		-addext "subjectAltName = DNS:localhost,IP:$$IP_ADDR" \
# 		> /dev/null 2>&1 ;
# 	@cp backend/certs/*.pem frontend/certs/ ;
# 	@echo "$(GREEN)✅ Certificados creados correctamente.$(RESET)"

certs: backend/certs/cert.pem frontend/certs/cert.pem

# backend/certs/cert.pem backend/certs/key.pem:
# 	mkdir -p backend/certs
# 	openssl req -x509 -newkey rsa:4096 \
# 		-keyout backend/certs/key.pem \
# 		-out backend/certs/cert.pem \
# 		-days 365 -nodes -subj "/CN=localhost"

backend/certs/cert.pem backend/certs/key.pem:
	mkdir -p backend/certs
	IP_ADDR=$$(hostname -I | awk '{print $$1}') ; \
	@echo -e "$(GREEN)🔧 Generando certificado para IP $$IP_ADDR ...$(RESET)"; \
	openssl req -x509 -newkey rsa:4096 -nodes \
		-keyout backend/certs/key.pem \
		-out backend/certs/cert.pem \
		-days 365 \
		-subj "/CN=localhost" \
		-addext "subjectAltName = DNS:localhost,IP:$$IP_ADDR" \
		> /dev/null 2>&1 ;

frontend/certs/cert.pem frontend/certs/key.pem: backend/certs/cert.pem backend/certs/key.pem
	mkdir -p frontend/certs
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
	rm -rf bbdd/

# Eliminar certificados
clean-certs:
	@echo "🗑️ Eliminando certificados..."
	rm -f backend/certs/*.pem frontend/certs/*.pem

# Reconstruir todo desde cero
rebuild: fclean build

.PHONY: certs