const IORedis = require('ioredis');
require('dotenv').config({path: '../.env'});


const redisConfig = {
    port: process.env.BULLMQ_REDIS_PORT,
    host: process.env.BULLMQ_REDIS_HOST,
    maxRetriesPerRequest: null,
}

const redisConnection = new IORedis(redisConfig);

module.exports = {
    redisConnection
}