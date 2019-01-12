#!/bin/bash
echo -e "\\033]2;start home main e2e\\007"
docker-compose run --name start-home-main-e2e \
  --rm \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --workdir /apps/home-main/ \
  start-home-main-ds \
  yarn run test:e2e --headless
