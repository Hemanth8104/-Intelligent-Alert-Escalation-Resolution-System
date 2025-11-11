const Redis = require('ioredis');
require('dotenv').config();

class RedisManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initRedis();
    }

    async initRedis() {
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 3,
                lazyConnect: true
            });

            this.client.on('connect', () => {
                console.log(' Connected to Redis');
                this.isConnected = true;
            });

            this.client.on('error', (err) => {
                console.log(' Redis connection error:', err.message);
                this.isConnected = false;
            });

            await this.client.ping();
        } catch (error) {
            console.log('  Redis not available, falling back to in-memory storage');
            this.isConnected = false;
        }
    }

    async set(key, value, expireSeconds = null) {
        if (!this.isConnected) return null;
        try {
            const serialized = JSON.stringify(value);
            if (expireSeconds) {
                return await this.client.setex(key, expireSeconds, serialized);
            }
            return await this.client.set(key, serialized);
        } catch (error) {
            console.error('Redis SET error:', error);
            return null;
        }
    }

    async get(key) {
        if (!this.isConnected) return null;
        try {
            const result = await this.client.get(key);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }

    async del(key) {
        if (!this.isConnected) return null;
        try {
            return await this.client.del(key);
        } catch (error) {
            console.error('Redis DEL error:', error);
            return null;
        }
    }

    async keys(pattern) {
        if (!this.isConnected) return [];
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            console.error('Redis KEYS error:', error);
            return [];
        }
    }

    async zadd(key, score, member) {
        if (!this.isConnected) return null;
        try {
            return await this.client.zadd(key, score, member);
        } catch (error) {
            console.error('Redis ZADD error:', error);
            return null;
        }
    }

    async zrevrange(key, start, stop) {
        if (!this.isConnected) return [];
        try {
            return await this.client.zrevrange(key, start, stop);
        } catch (error) {
            console.error('Redis ZREVRANGE error:', error);
            return [];
        }
    }
}

module.exports = RedisManager;
