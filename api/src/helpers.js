const fs = require('fs/promises'),
    path= require('path'),
    fetch = require('node-fetch'),
    urlp = require('url');



module.exports = {
    async buffer_from_u_r_l(url){
        if(!(url instanceof URL))
            url = new URL(url);
        if(url.protocol == 'file:'){
            //eslint-disable-next-line snakecasejs/snakecasejs
            return await fs.read_file(urlp.fileURLToPath(url));
        }else{
            return await fetch({
                url: url.toString()
            });
        }
    },
    add_url_base_if_required(url, base){
        try{
            return new URL(url);
        }catch{
            //Assume this is a file name
            return new URL(url, base + '/');
        }
    },
    url_basename(url){
        return path.basename(url.pathname);
    },
    
};