import {PnM} from "./pnm_elem";
const fetchy = new Proxy(globalThis.fetch, {
    async apply(target, that, args){
        // console.log(target,args)
        let oret={request:{},response:{}};
        const [url, opts] = args;
        oret.url=url;
        
        
        const temp=await target(oret.url, opts);
        
        oret.code=temp.status;
        oret.status=temp.statusText;
        oret.request.header=opts.headers;
        oret.response.contentType=temp.headers.get("Content-Type").split(";")[0];
        if(oret.response.contentType=='application/json'){
            oret.result=await temp.json();
        }else if(oret.response.contentType=='text/html'){
            oret.request.Accept="Accept" in opts.headers 
                ? opts.headers.Accept.split(";")[0] : "";
            const t=await temp.text();
            if(oret.request.Accept=='text/html') {
                oret.result=t;
                oret.response.result= t;
            }else{
                var dom=document.createElement('div');
                dom.innerHTML= t.replace(/<\!--.*?-->/g, "");
                PnM(dom).strip(['script','link','style']);
                oret.result= dom.innerText.replace(/\n/g,"").replace(/\t/g," ").replace(/\s+/g," ").trim();
                oret.response.result= dom;
            }
        } else{
            const t=await temp.text();
            oret.result= t;
        }
        delete oret.url; delete oret.response; delete oret.request;
        
        return oret;
    },
});

class sync_request{
    constructor(url){ 
        this.params={
            method: "GET", 
            mode:'cors',
            headers: { "Content-Type": "application/json"},
        };
        this.url=url;
    }
    header(h){
        this.params.headers=Object.assign(this.params.headers, h);
        return this;
    }
    get(o){
        if(o!=undefined && typeof(o)=="object"){
            var q=new URLSearchParams(o).toString();
            this.url= this.url.indexOf('?')>0 ? `${this.url}&${q}` : `${this.url}?${q}`;
        } return this.res();
    }
    post(o){
        this.params.method="POST";
        if(o!=undefined && typeof(o)=="object"){ this.params.body= JSON.stringify(o); } 
        return this.res();
    }
    put(o){
        this.params.method="PUT";
        if(o!=undefined && typeof(o)=="object"){ this.params.body= JSON.stringify(o); } 
        return this.res();
    }
    patch(o){
        if(o!=undefined && typeof(o)=="object"){ this.params.body= JSON.stringify(o); } 
        this.params.method="PATCH";
        return this.res();
    }
    async res(){
        let d=await fetchy(this.url, this.params);
        console.log(this);
        d.result !=undefined && d.result.T!=undefined && delete d.result.T;
        return JSON.parse(JSON.stringify(d));
    }
}
const request=(u)=>{return new sync_request(u);};
export {request};
