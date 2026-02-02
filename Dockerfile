FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY config ./config
COPY fixtures ./fixtures
RUN addgroup -S sentinel && adduser -S sentinel -G sentinel && mkdir -p /data && chown sentinel:sentinel /data
USER sentinel
EXPOSE 7331
VOLUME ["/data"]
ENTRYPOINT ["node", "--experimental-strip-types", "src/main.ts"]
CMD ["serve", "--config", "config/example.json"]
