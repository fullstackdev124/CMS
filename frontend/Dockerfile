FROM node:current-slim as build-stage
WORKDIR /app/
COPY *.conf /app/
COPY *.json /app/
COPY *.js /app/
COPY browserslist /app/
RUN mkdir -p /app/src/
COPY src /app/src/
RUN ls -lR /app/*
RUN cd /app && npm install npm@latest
RUN cd /app && npm install
RUN cd /app && npm install -g @angular/cli
RUN cd /app && npm install -g @angular-devkit/build-angular
RUN npx browserslist --update-db
RUN cd /app && npm run go-lab
RUN cd /app && npm run build-dev

FROM nginx:1.15-alpine
EXPOSE 80
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-stage /app/dist/Epic/ /usr/share/nginx/html
COPY --from=build-stage /app/nginx-custom.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
