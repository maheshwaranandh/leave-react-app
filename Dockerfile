FROM node:18

RUN apt-get update && apt-get install -y git

WORKDIR /app

RUN git clone https://github.com/Varunpro16/leave-form-Revised.git .

RUN npm install --prefix server

RUN npm install --prefix client

EXPOSE 3000
EXPOSE 4000

CMD ["bash", "-c", "cd /app/server && npm start & cd /app/client && npm start"]

