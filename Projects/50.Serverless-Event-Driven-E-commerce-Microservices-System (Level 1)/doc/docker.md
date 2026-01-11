

export GITHUB_TOKEN=ghp_xxx
docker build --build-arg GITHUB_TOKEN=$GITHUB_TOKEN -t post-service .
