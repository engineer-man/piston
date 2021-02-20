const fs = require('fs/promises');
const fss = require('fs');

const logger = require('logplease').create('state');
const state = new Map();

function replacer(key, value) {
    if(value instanceof Map) {
        return {
            data_type: 'Map',
            value: Array.from(value.entries()),
        };
    } else {
        return value;
    }
}
  
function reviver(key, value) {
    if(typeof value === 'object' && value !== null) {
        if (value.data_type === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}
  

module.exports = {
    state,
    async load(data_file){
        if(fss.exists_sync(data_file)){
            logger.info('Loading state from file');
            var content = await fs.read_file(data_file);
            var obj = JSON.parse(content.toString(), reviver);
            [...obj.keys()].forEach(k => state.set(k, obj.get(k)));
        }else{
            logger.info('Creating new statefile');
            state.set('repositories', new Map().set('offical', 'https://repo.pistonee.org/index.yaml'));
        }
    },
    async save(data_file){
        logger.info('Saving state to disk');
        await fs.write_file(data_file, JSON.stringify(state, replacer));
    }
};