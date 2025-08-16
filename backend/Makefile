# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: danjimen <danjimen@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/17 00:36:40 by danjimen          #+#    #+#              #
#    Updated: 2025/08/17 01:16:51 by danjimen         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

all: up

up:
	docker compose -f docker-compose.yml up -d --build

down:
	docker compose -f docker-compose.yml down --remove-orphans

logs:
	docker compose -f docker-compose.yml logs -f

re: down up

clean:
	docker compose -f docker-compose.yml down --remove-orphans
	docker image prune -f

fclean:
	docker compose -f docker-compose.yml down --volumes --remove-orphans
	docker container prune -f
	docker image prune -af

status:
	@echo "🟦 Docker containers:"
	@docker ps -a --filter name=transcendence