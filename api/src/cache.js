const globals = require('./globals');
const logger = require('logplease').create('cache');
const fs = require('fs/promises'),
    fss = require('fs'),
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
        cache.forEach((v,k)=>{
            var file_path = path.join(cache_dir, k);
            if(v.expiry < Date.now()){
                //remove from cache
                cache.delete(k);
                fs.stat(file_path, (err, stats)=>{
                    if(err) return; //ignore - probably hasn't been flushed yet
                    if(stats.is_file())
                        fs.rm(file_path, (err)=>{
                            if(err) logger.warn(`Couldn't clean up on-disk cache file ${k}`);
                        });
                });
            }else{
                //flush to disk
                fs.write_file(file_path, JSON.stringify(v),()=>{});
            }
        });

    },
    async load(cache_dir){
        return fs.readdir(cache_dir)
            .then(files => Promise.all(files.map(
                async file => {
                    cache.set(file, JSON.parse(fss.read_file_sync(path.join(cache_dir,file)).toString()));
                }
            )));
    }

};