const http = require('http');
const express = require('express')
const cors = require('cors')
const { initHttp } = require('./app-http')
const { initWebsocket } = require('./app-socket')
const { initPTYWebsocket } = require('./pty/terminal-socket')
require('dotenv').config({path: './.env'})


const app = express();
const server = http.createServer(app);

//for terminal socker server
const app_terminal = express();
const terminal_server = http.createServer(app_terminal);

const APP_SERVER_PORT = process.env.APP_SERVER_PORT;
const PTY_SERVER_PORT = process.env.PTY_SERVER_PORT;

app.use(cors());

app.use(express.json());

initHttp(app);

initWebsocket(server)

initPTYWebsocket(terminal_server)

server.listen(APP_SERVER_PORT, () => {
    console.log('Worker Server listening to PORT:',APP_SERVER_PORT);
})

terminal_server.listen(PTY_SERVER_PORT, () => {
    console.log('PTY Server listening to PORT:',PTY_SERVER_PORT);
})

