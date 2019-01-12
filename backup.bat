#!/bin/bash
echo "github backup"

git add --all
git commit -am "backup"
git push origin master
