const {PTY} = require('./pty-service')
const os = require('os');
const { exec } = require('child_process');

class TerminalManager { 
    //Dictonary for socketId to PTY object mapping
    sessions = {};

    constructor(){
        this.sessions = {}
    }

    createPTY(socket, username, projectId) { 
      let newPty = new PTY(socket, username, projectId)

      this.sessions[socket.id] = newPty;

      this.sessions[socket.id].getTerminal().on('exit', () => {
        delete this.sessions[socket.id];
      });

      this.sessions[socket.id].getTerminal().on('close', () => {
        delete this.sessions[socket.id];
      });
      //return process id of pty
      return this.sessions[socket.id].getTerminal().pid;
    }

    writeTerminal(terminalId, data) {
        this.sessions[terminalId].writeTerminal(data);
    }

    clearTerminal(terminalId){
        if (this.sessions[terminalId]) {
           try{
              if(os.platform() === 'win32'){
                //on windows: Use taskkill instead
                exec(`taskkill /PID ${this.sessions[terminalId].getTerminal().pid} /F`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error terminating terminal ${terminalId}:`, error);
                    } else {
                        console.log(`Terminal ${terminalId} terminated`);
                    }
                    delete this.sessions[terminalId];
                });
              }
              else{
                //on Linux/macOS: kill() works fine.
                this.sessions[terminalId].getTerminal().kill();
                delete this.sessions[terminalId];
              }
           }
           catch (err) {
              console.error(`Error terminating terminal ${terminalId}:`, err);
           }
        }
    }

}


const terminalManager = new TerminalManager();

module.exports = {
    terminalManager
}