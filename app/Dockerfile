FROM node:17-alpine

LABEL author="Selcuk SERT"
LABEL mail="selcuk.sert@gmail.com"
LABEL version="1.0"
LABEL description="Image for dummy apps based on NodeJS"

ARG APP_NAME
ARG USER_HOME=/home/appuser
ARG APP_HOME=$USER_HOME/src

RUN addgroup -S appgroup && \
    adduser -h $USER_HOME -S appuser appgroup

USER appuser

# Create app directory
WORKDIR $APP_HOME
# Bundle app source and deps
COPY common ./common
COPY $APP_NAME ./$APP_NAME

USER root
RUN chown -R appuser $APP_HOME

USER appuser
WORKDIR $APP_HOME/$APP_NAME
RUN yarn install

EXPOSE $WEB_PORT

ENTRYPOINT ["yarn"]
CMD ["start"]
