#!/bin/bash
echo -e "\\033]2;start home main lint\\007"
docker-compose run --name start-home-main-ds-lint \
  --rm \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --workdir /apps/home-main/ \
  start-home-main-ds \
  yarn run lint

