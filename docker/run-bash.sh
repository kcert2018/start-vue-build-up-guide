#!/bin/bash
echo -e "\\033]2;start home main bash\\007"
docker-compose run --name start-home-main-ds-bash \
  --rm \
  -u $(id -u ${USER}):$(id -g ${USER}) \
  --workdir /apps/ \
  start-home-main-ds \
  bash
