const pty = require('node-pty')
const os = require('os');
const path = require('path');


class PTY {
    socket = null;
    username = '';
    projectId = '';
    shell = '';
    terminal =  null;

    constructor(socket, username, projectId){
        this.socket = socket;
        this.projectId = projectId;
        this.username = username;
        this.shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

        this.createPTY();
    }

    createPTY() {
       this.terminal = pty.spawn(this.shell, [], {
        cols: 100,
        name: 'xterm-256color',
        cwd: path.join(__dirname, `../workspace/${this.username}/${this.projectId}`),
        env: process.env
       })

       this.terminal.on('data', (data) => {
         this.socket.emit('terminal-result', {result: data});
         //this.socket.emit('terminal-result', {result: Buffer.from(data, 'utf-8')});
       })
    }

    getTerminal(){
      return this.terminal;
    }

    writeTerminal(data){
      if(this.terminal!=null){
        this.terminal.write(data);
      }
    }
}


module.exports = {
    PTY
}

