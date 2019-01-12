#!/bin/bash
echo -e "\\033]2;start home main unit\\007"
docker-compose run --name start-home-main-unit \
  --rm \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --workdir /apps/home-main/ \
  start-home-main-ds \
  yarn run test:unit
