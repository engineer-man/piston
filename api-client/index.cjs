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

    get url_base(){
        return this.#base
    }
}


class PistonEngine extends APIWrapper {
    constructor(base_url = 'http://127.0.0.1:6969'){
        super(base_url);
    }

    run_job({language, version, files, main, args, stdin, compile_timeout, run_timeout}){
        return this.post(`/jobs`, {language, version, files, main, args, stdin, compile_timeout, run_timeout})
    }

    list_packages(){
        return this.get('/packages').then(x=>x.packages)
    }

    install_package({language, version}){
        return this.post(`/packages/${language}/${version}`);
    }

    uninstall_package({language, version}){
        return this.post(`/packages/${language}/${version}`);
    }
}


module.exports = {PistonEngine}