const globals = require('./globals');
const logger = require('logplease').create('cache');
const fs = require('fs/promises'),
    path = require('path');

const cache = new Map();

module.exports = {
    cache_key: (context, key) => Buffer.from(`${context}-${key}`).toString('base64'),
    has(key){
        return cache.has(key) && cache.get(key).expiry > Date.now();
    },
    async get(key, callback, ttl=globals.cache_ttl){
        logger.debug('get:', key);

        if(module.exports.has(key)){
            logger.debug('hit:',key);
            return cache.get(key).data;
        }

        logger.debug('miss:', key);
        var data = await callback();
        cache.set(key, {data, expiry: Date.now() + ttl});

        return data;
    },
    async flush(cache_dir){
        logger.info('Flushing cache');

        async function flush_single(value, key){
            const file_path = path.join(cache_dir, key);

            if(value.expiry < Date.now()){
                cache.delete(key);
                try {
                    const stats = await fs.stat(file_path);
                    if(stats.is_file())
                        await fs.rm(file_path);
                }catch{
                    // Ignore, file hasn't been flushed yet
                }
            }else{
                await fs.write_file(file_path, JSON.stringify(value));
            }

        }

        return Promise.all(
            Array.from(cache).map(flush_single)
        );

    },
    async load(cache_dir){
        const files = await fs.readdir(cache_dir);

        async function load_single(file_name){
            const file_path = path.join(cache_dir,file_name);
            const file_content = await fs.read_file(file_path).toString();
            cache.set(file_name, JSON.parse(file_content));
        }

        return Promise.all(files.map(load_single));
    }

};