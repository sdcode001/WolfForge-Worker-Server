const {Socket, Server} = require('socket.io');
const { terminalManager } = require('./terminal-manager')


function initPTYWebsocket(server) {
    const io = new Server(server, {
        cors: {
           origin: "*",
           methods: ['GET', 'POST']
        }
    })

    io.on('connection', async (socket) => {
        console.log(`Terminal: ${socket.id} connected...`)
        socket.emit('terminal-connected', {TerminalId: socket.id, Message: 'Terminal server connected...'});

        socket.on('create-terminal', (data) => {
            const pid = terminalManager.createPTY(socket, data.username, data.projectId);
            socket.emit('created-terminal', {ProcessId: pid});
        })

        socket.on('write-terminal', (data) => {
            terminalManager.writeTerminal(socket.id, data.command);
        })

        socket.on('disconnect', () => {
            terminalManager.clearTerminal(socket.id);
        })
    })

}

module.exports = {
    initPTYWebsocket
}


