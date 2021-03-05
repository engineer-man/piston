const fetch = require('node-fetch')

function url_join(base, endpoint){
    return base + endpoint
    //return new URL(endpoint, base).href;
}

class APIWrapper {
    #base;
    constructor(base_url){
        this.#base = base_url.toString()
    }

    async query(endpoint, options={}){
        const url = url_join(this.#base, endpoint);
        return await fetch(url, options)
            .then(res=>res.json())
            .then(res=>{if(res.data)return res.data; throw new Error(res.message)});
    }

    get(endpoint){
        return this.query(endpoint);
    }

    post(endpoint, body={}){
        return this.query(endpoint, {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        })
    }

    delete(endpoint, body={}){
        return this.query(endpoint, {
            method: 'delete',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        })
    }

    get_child_object(endpoint, class_type){
        return this.get(endpoint).then(x => new class_type(this, x))
    }

    get url_base(){
        return this.#base
    }
}

class PistonEngineRepositoryPackage extends APIWrapper {
    constructor(repo, {language, language_version, author, buildfile, size, dependencies, installed}){
        super(url_join(repo.url_base, `/packages/${language}/${language_version}`))

        this.language = language;
        this.language_version = language_version;
        this.author = author;
        this,buildfile = buildfile;
        this.size = size;
        this.dependencies = dependencies;
        this.installed = installed;
    }

    install(){
        return this.post('/', {});
    }

    uninstall(){
        return this.delete('/', {});
    }
}

class PistonEngineRepository extends APIWrapper {
    
    constructor(engine, {slug, url, packages}){
        super(url_join(engine.url_base,`/repos/${slug}`))

        this.slug = slug;
        this.url = url;
        this.package_count = packages

    }

    list_packages(){
        return this.get(`/packages`).then(x=>x.packages)
    }

    get_package(language, language_version){
        return this.get_child_object(`/packages/${language}/${language_version}`, PistonEngineRepositoryPackage)
    }
}

class PistonEngine extends APIWrapper {
    constructor(base_url = 'http://127.0.0.1:6969'){
        super(base_url);
    }

    list_repos(){
        return this.get(`/repos`);
    }

    add_repo(slug, url){
        return this.post(`/repos`, {slug, url})
    }

    get_repo(slug){
        return this.get_child_object(`/repos/${slug}`, PistonEngineRepository)
    }

    run_job({language, version, files, main, args, stdin, compile_timeout, run_timeout}){
        return this.post(`/jobs`, {language, version, files, main, args, stdin, compile_timeout, run_timeout})
    }
}


module.exports = {PistonEngine}