docker build -t ft-transcendence-backend .

docker run -p 3000:3000 ft-transcendence-backend
docker run -d -p 3000:3000 --name backend-container ft-transcendence-backend

docker stop backend-container
