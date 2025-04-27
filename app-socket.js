const {Socket, Server} = require('socket.io');
const { s3Manager }  =  require('./aws-s3-service');
const { fileManager } = require('./file-manager-service');
const path = require('path');
const { fileContentQueue } = require('./bullmq-queue/queues');
const fs  = require('fs');

//Map- {projectId: List[SocketId]}
//This dictionary will maintain session of projects and connected users to the projects
const projectSessions = {}

function initWebsocket(server){
    const io = new Server(server, {
        cors: {
           origin: "*",
           methods: ['GET', 'POST']
        }
     })

     io.on('connection', async (socket) => {
        console.log(`Client: ${socket.id} connected...`)
        socket.emit('connected', {SocketId: socket.id, Message: 'Socket server connected...'});
    
        socket.on('createProject',async (data) => {
          //copy project form S3 bucket to local
          try{
             const result = await s3Manager.copyFromS3ProjectsToLocal(data.username, data.projectId);
             if(result.status == 1){
                const content = await fileManager.getDirectory(path.join(__dirname, `workspace/${data.username}/${data.projectId}`), '');
                //set the session
                if (!projectSessions[data.projectId]) {
                  projectSessions[data.projectId] = [];
                }
                projectSessions[data.projectId].push(socket.id)

                socket.emit('createProjectResult', {status: 1, data: content});
             }
             else{
                socket.emit('createProjectResult', {status: 0, data: null});
             }
          }
          catch(err){
             console.error(err);
             socket.emit('createProjectResult', {status: 0, data: null});
          }
        })
    
        socket.on('get-directory', async (data) => {
          try{
             const dirContent = await fileManager.getDirectory(path.join(__dirname, `workspace/${data.username}/${data.projectId}${data.path}`), data.path);
             socket.emit('directory-content', {path: data.path, data: dirContent});
          }
          catch(err){
             socket.emit('directory-content', {path: data.path, data: []});
             console.error(err)
          }
        })
    
        socket.on('get-file-content', async(data) => {
           try{
              const fileContent = await fileManager.getFileContent(path.join(__dirname, `workspace/${data.username}/${data.projectId}${data.path}`));
              socket.emit('file-content', {path: data.path, data: fileContent});
           }
           catch(err){
             socket.emit('file-content', {path: data.path, data: ''});
             console.error(err)
           }
        })
    
    
        socket.on('update-file-content', async(data) => {
           //update local file content
           try{
              fileManager.updateFileContent(path.join(__dirname, `workspace/${data.username}/${data.projectId}${data.path}`), data.content)
              .then(async (data1) => { 
                await fileContentQueue.add(data.fileName, data);
                socket.emit('file-update-result', {status: 1});
              })
              .catch(err => {
                socket.emit('file-update-result', {status: 0});
                console.error(err)
              })
           }
           catch(err){
              socket.emit('file-update-result', {status: 0});
              console.error(err)
           }
        });

        socket.on('disconnecting-project', async(data) => {
           const {projectId, username} = data;
           if(projectSessions[projectId]){
             projectSessions[projectId] = projectSessions[projectId].filter(v => v!==socket.id);

             //when all users left the project
             if(projectSessions[projectId].length == 0){
               const projectPath = path.join(__dirname, `workspace/${username}/${projectId}`);

               //update all project config files in S3 bucket before clear up project
               const configFilePath = path.join(projectPath, 'backup.conf');
               if(fs.existsSync(configFilePath)){
                  fileManager.getFileContent(configFilePath).then(async (data) => {
                     const cleanData = data.replace(/\\[nrtf\b\v"'\\]/g, '').trim(); // remove escape sequences
                     const confFilePaths = cleanData.split(',').map(s => s.trim());
                     //used async aware for loop because forEach doesn't await async callbacks.
                     for (const v of confFilePaths) {
                        const backupFilePath = path.join(projectPath, v);
                        const content = await fileManager.getFileContent(backupFilePath);
                        if (content) {
                          const queueData = {username: username, projectId: projectId, path: v, fileName: v, content: content};
                          await fileContentQueue.add(v, queueData);
                        }
                      }
                     //all users left for this project. So clear up local project
                     fileManager.deleteFileOrDirectory(projectPath).then(async(value) => {
                        //TODO- notify router server that all users left
                     })
                     .catch(err => {
                        console.error(err);
                     }) 
                  })
                  .catch(ex => {
                     console.log(ex);
                  })
               }                 
             }
           }
        });
    

        socket.on('disconnect', () => {
          console.log(`Client: ${socket.id} disconnected...`)
        })   
    })
}

module.exports = {
    initWebsocket
}