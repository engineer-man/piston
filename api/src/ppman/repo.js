const logger = require('logplease').create('ppman/repo');
const cache = require('../cache');
const CACHE_CONTEXT = 'repo';

const cp = require('child_process');
const yaml = require('js-yaml');
const { Package } = require('./package');
const helpers = require('../helpers');

class Repository {
    constructor(slug, url){
        this.slug = slug;
        this.url = new URL(url);
        this.keys = [];
        this.packages = [];
        this.base_u_r_l='';
        logger.debug(`Created repo slug=${this.slug} url=${this.url}`);
    }

    get cache_key(){
        return cache.cache_key(CACHE_CONTEXT, this.slug);
    }

    async load(){
        try{
            var index = await cache.get(this.cache_key,async ()=>{
                return helpers.buffer_from_u_r_l(this.url);
            });

            var repo = yaml.load(index);
            if(repo.schema != 'ppman-repo-1'){
                throw new Error('YAML Schema unknown');
            }

            this.keys = repo.keys;
            this.packages = repo.packages.map(pkg => new Package(this, pkg));
            this.base_u_r_l = repo.baseurl;
        }catch(err){
            logger.error(`Failed to load repository ${this.slug}:`,err.message);
        }
    }


    async import_keys(){
        await this.load();
        logger.info(`Importing keys for repo ${this.slug}`);

        await new Promise((resolve,reject)=>{
            const gpgspawn = cp.spawn('gpg', ['--receive-keys', this.keys], {
                stdio: ['ignore', 'ignore', 'ignore']
            });

            gpgspawn.once('exit', (code, _) => {
                if(code == 0) resolve();
                else reject(new Error('Failed to import keys'));
            });

            gpgspawn.once('error', reject);
            
        });

    }

}

module.exports = {Repository};