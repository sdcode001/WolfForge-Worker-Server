const { setFips } = require('crypto');
const fs = require('fs');
const path = require('path');


class FileManager {

   async createDirectoryOrFile(dirPath, isFile) {
       return new Promise(async (resolve, reject) => {
           //when recursive=true, it will recursively create directory from parent to child.
           fs.mkdir(dirPath, {recursive: true}, (err) => {
            if (err) {
               return reject(err);
            }  
            if(isFile){
               fs.writeFile(dirPath, '', (err) => {
                 if (err) {
                    return reject(err);
                 } 
               });
            }  
            resolve("success");
           });
       });
    }

   async writeFile(filepath, fileContent){
       return new Promise(async (resolve, reject) => {
          //first create directories of filepath if not exists.
          await this.createDirectoryOrFile(path.dirname(filepath), false);
          
            fs.writeFile(filepath, fileContent, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve({status: 1});
                }
            });
        });
    }

    async getDirectory(dirPath, basePath){
        return new Promise(async (resolve, reject) => {
            fs.readdir(dirPath, {withFileTypes: true}, (err, files) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(
                        files
                        .filter(file => file.name !== 'backup.conf')
                        .map(file => ({type: file.isDirectory() ? 'directory' : 'file', name: file.name, path: `${basePath}/${file.name}`}))
                    );
                }
            })
        });
    }

    async getFileContent(filePath){
        return new Promise(async (resolve, reject) => {
            fs.readFile(filePath, {encoding: 'utf8'}, (err, data) => {
                if(err){
                    reject(err);
                }
                else{
                    resolve(data);
                }
            })
        })
    }

    async updateFileContent(filepath, fileContent){
        return new Promise(async (resolve, reject) => {
            fs.writeFile(filepath, fileContent, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve({status: 1})
                }
           });
        })
    }
    
    async deleteFileOrDirectory(targetPath){
        return new Promise(async (resolve, reject) => {
            fs.rm(targetPath, {recursive: true, force: true}, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve({status: 1})
                }
            })
        })
    }

    
}

const fileManager = new FileManager();

module.exports = {
    fileManager
}
