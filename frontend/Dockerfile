FROM webratio/nodejs-http-server

VOLUME /tmp

ADD dist /opt/www

# React 환경변수는 보통 REACT_APP_ 접두사 사용
ARG REACT_APP_API_HOST
ENV REACT_APP_API_HOST=$REACT_APP_API_HOST

ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 9003

ADD run.sh /opt/run.sh
ENTRYPOINT ["sh", "/opt/run.sh"]
