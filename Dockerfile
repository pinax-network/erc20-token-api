FROM oven/bun
COPY . .
RUN apt-get -y update
RUN apt-get -y install git
RUN bun install
ENTRYPOINT [ "bun", "run", "start" ]