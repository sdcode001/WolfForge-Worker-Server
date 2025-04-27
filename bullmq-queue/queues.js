const { Queue } = require('bullmq');
const { redisConfig } =  require('./redis-connection');


const fileContentQueue = new Queue('file-content-queue',
    {
        connection: redisConfig
    }
);

module.exports = {
    fileContentQueue
}