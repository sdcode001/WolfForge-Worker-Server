const {v4 : uuidv4} = require('uuid')
const path = require('path');
const { s3Manager }  =  require('./aws-s3-service');
const { fileManager } = require('./file-manager-service');
const { error } = require('console');

function initHttp(app){
    app.get('/check', async(req, res) => {
        return res.status(200).json({message: "Hi Souvik. I'm up..."});
    })

    app.post('/create-file-folder', async(req, res) => {
        //req.body: {username:string, projectId:string, path:string, type:string, name:string}
        const data = req.body;
        const localDestination = path.join(__dirname, `workspace/${data.username}/${data.projectId}${data.path}/${data.name}`);
          if(data.type=='directory'){
                fileManager.createDirectoryOrFile(localDestination, false).then(async (value)=> {
                    const result = await s3Manager.createDirectory(data.username, data.projectId, data.path, data.name);
                    if(result.status==0){return res.status(500).json(result);}
                    return res.status(200).json(result);
                })
                .catch(error => {
                    console.error(error);
                    return res.status(500).json({status: 0, path: null});
                });
          }
          else{
                fileManager.writeFile(localDestination, '').then(async (value) => {
                    const result = await s3Manager.createFile(data.username, data.projectId, data.path, data.name);
                    if(result.status==0){return res.status(500).json(result);}
                    return res.status(200).json(result);
                })
                .catch(error => {
                    console.error(error);
                    return res.status(500).json({status: 0, path: null});
                });
          }        
    });


    app.delete('/delete-file-folder', async(req, res) => {
        //req.body: {username:string, projectId:string, path:string, type:string}
        const data = req.body;
        const localDestination = path.join(__dirname, `workspace/${data.username}/${data.projectId}${data.path}`);
        fileManager.deleteFileOrDirectory(localDestination).then(async (value) => {
            if(data.type == 'directory'){
               const result = await s3Manager.deleteDirectory(data.username, data.projectId, data.path);
               if(result.status==0){return res.status(500).json(result);}
               return res.status(200).json(result);
            }
            else{
                const result = await s3Manager.deleteFile(data.username, data.projectId, data.path);
                if(result.status==0){return res.status(500).json(result);}
                return res.status(200).json(result);
            }
        })
        .catch((error) => {
            console.error(error);
            return res.status(500).json({status: 0});
        })
    });

    
    // app.put('/rename-file-folder', async(req, res) => { })
}

module.exports = {
    initHttp
}