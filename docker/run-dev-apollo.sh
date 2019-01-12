#!/bin/bash
echo -e "\\033]2;start home main develop apollo sever\\007"
docker-compose run --name start-home-main-dev-apollo-server \
  --rm \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --workdir /apps/home-main/ \
  start-home-main-ds \
  yarn run apollo
