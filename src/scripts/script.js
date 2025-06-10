import {MHDyna} from './pnm_dyna'

const SZO = !import.meta.client ? null: new ResizeObserver(x => {
    x.forEach(entry => {
      var w=entry.contentRect.width, 
      dup=document.querySelector('.inav'),
      g=PnM('div').classes('block').styles({'width':`${w}px`}).get();
      dup.innerHTML=""; dup.append(g);
    });
  });

const MUT = !import.meta.client ? null: new MutationObserver(x => {
    x.forEach(m=> {
      if (m.type === 'attributes' && m.attributeName === 'class') {
          var tgt=m.target, w=tgt.offsetWidth, 
          dup=document.querySelector('.inav'),
          g=PnM('div').classes('block').styles({'width':`${w}px`}).get();
          if(tgt.classList.contains('show')){  dup.innerHTML=""; dup.append(g);}
          else{dup.innerHTML="";}
      }
    })
});

const LS={
    exists:(k)=>{ return !import.meta.client ? "":  localStorage[k]!=undefined; },
    set:(k,val)=>{ import.meta.client && (localStorage[k]=JSON.stringify(val)); },
    unset:(k)=>{ import.meta.client && localStorage.removeItem(k);},
    get:(k)=>{ if(import.meta.client && k in localStorage){return JSON.parse(localStorage[k]);} return false;}
}
const JWT={
    extract:(token) =>{
        try{
            const [header, payload] = token.split('.');
            if (!payload) { throw new Error('Invalid JWT token'); }
            const decodedPayload = JWT.base64UrlDecode(payload);
            return JSON.parse(decodedPayload);
        }catch(e){throw new Error("extract failed");}
    },
    verify:async(token, publicKeyPem) =>{
        try{
            const [header, payload, signature] = token.split('.');
            if (!header || !payload || !signature) { 
                return {"_verify":false,"error":"invalid token"}
                // throw new Error('Invalid JWT token'); 
            }
            const publicKey = await JWT.importPemKey(publicKeyPem.trim());
            const isValid = await crypto.subtle.verify(
                { name: 'RSASSA-PKCS1-v1_5' },
                publicKey,
                JWT.base64UrlToUint8Array(signature),
                new TextEncoder().encode(`${header}.${payload}`)
            );
            if (!isValid) { 
                return {"_verify":false,"error":"invalid"}
                //throw new Error('JWT verification failed'); 
            }else{
                let res=JWT.extract(token);
                res._verify=true;
                return res;
            }
        }catch(e){ throw new Error("verification failed"); }
    },
    importPemKey:async(pem)=> {
        try{
            const pemHeader = '-----BEGIN PUBLIC KEY-----';
            const pemFooter = '-----END PUBLIC KEY-----';
            const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
            const binaryDer = JWT.base64UrlToUint8Array(pemContents);
            return crypto.subtle.importKey( 'spki', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256', }, true, ['verify'] );
        }catch(e){throw new Error("importPemKey failed");}
    },
    base64UrlDecode:(input) =>{
        try{
            const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
            const decoded = atob(base64);
            return decodeURIComponent(
                decoded.split('').map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`).join('')
            );
        }catch(e){throw new Error("base64UrlDecode failed");}
    },
    base64UrlToUint8Array:(base64Url)=>{
        try{
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++){    bytes[i] = binaryString.charCodeAt(i); }
            return bytes;
        }catch(e){throw new Error("base64UrlToUint8Array failed");}
    }
}
const evForm={
    conf:{sel:'.fField',default_scope:'body'},
    elm_obj_assign:(scope,elmsel,prop,target)=>{
        scope.querySelectorAll(elmsel).forEach(l=>{ l[prop]=target; });
    },
    init:(scope="")=>{
        scope=="" && (scope=evForm.conf.default_scope);
        var sel=document.querySelector(scope);
        sel.querySelectorAll(evForm.conf.sel).forEach(el=>{
            evForm.register(el);
        });
        evForm.elm_obj_assign(sel,"[data-type='dynatable']","DispData",MHDyna);
        // document.querySelector(`${scope }[data-type='dynatable']`)["DispData"]=MHDyna;
    },
    register:(el)=>{
        var type="regular";
        el.dataset.type!=undefined && (type=el.dataset.type);
        // console.log(`init ${type}`);
        switch(type){
            case 'autocomplete': evForm.init_autocomplete(el); break;
            case 'complexs': evForm.init_complex(el); break;
            case 'dropdown': evForm.init_dropdown(el); break;
            case 'multiselect': evForm.init_multiselect(el); break;
            case 'datetime': evForm.init_datetime(el); break;
            case 'date':  evForm.init_date(el); break;
            default:  break;
        }
    },
    ultoggle:(el)=>{
        if(el.style.display=='block'){
            el.style.removeProperty('display');
            el.style.removeProperty('z-index');
        } else { 
            el.style.display='block'; 
            el.style.zIndex=40; 
        }
    },
    ulkeydown:(e,elList)=>{
        var act=document.activeElement, curli=act.parentNode,
        vis=Array.from(elList.children).filter(s => window.getComputedStyle(s).getPropertyValue('display') != 'none'),
        vic=vis.length-1;
        elList.style.display!="block" && evForm.ultoggle(elList);
        e.keyCode==40 && curli.parentNode!=elList && ( curli=vis[vic] );
        e.keyCode==38 && curli.parentNode!=elList && ( curli=vis[0] );
        var vin=Array.prototype.indexOf.call(vis, curli);
        vic > -1 && elList.style.display=="block" && (
            /*key down*/e.keyCode==40  &&  
            ( e.preventDefault(), vin+1>vic 
                ? vis[0].children[0].focus()
                : vis[vin+1].children[0].focus() ),
            /*key up*/e.keyCode==38  && 
                ( e.preventDefault(), vin>0
                ? vis[vin-1].children[0].focus()
                : vis[vic].children[0].focus() ),
            /*enter space */(e.keyCode==13 || e.keyCode==32)  && 
                (act.click(),  e.preventDefault() ),
            /* tab on ul exit */
            (e.keyCode==9 && vin==vic) && evForm.ultoggle(elList),
            (e.shiftKey && e.keyCode==9 && act.nodeName!="A" ) && evForm.ultoggle(elList),
            e.keyCode==27 && evForm.ultoggle(elList)
        );
    },
    ulfilter:(elList,e)=>{
        var v=(e.target).nodeName=="INPUT"?(e.target).value:(e.target).textContent,items={};
        elList.childNodes.forEach(c=>{
            var a=c.children[0];
            items[a.dataset.key]=a.textContent;
            a.dataset.val= a.dataset.val==undefined ? a.textContent: a.dataset.val;
            if(a.dataset.key.indexOf(v)>-1 || a.dataset.val.indexOf(v)>-1) {
                c.style.removeProperty('display');
                var tx=a.dataset.val,
                    i=tx.indexOf(v),
                    le=i+(v.length),
                    ntc=i==0? "": tx.substr(0,i);
                i>-1 && (ntc+=`<span class="text-red-500">${v}</span>`+tx.substr(le,tx.length-le), a.innerHTML=ntc );
            }else{ c.style.display="none"; }
        });
    },
    mk_time:(e,y,m,d,h,i,s)=>{
        var tg=(e.target).dataset.part,
            vy=parseInt(y.value),
            vm=parseInt(m.value)-1,
            vd=parseInt(d.value),
            vh=h!=undefined && parseInt(h.value),
            vi=i!=undefined && parseInt(i.value),
            vs=s!=undefined && parseInt(s.value);
        switch(tg){
            case 'y': e.keyCode==38 && (vy=vy+1 ), e.keyCode==40 && (vy=vy-1); break;
            case 'm': e.keyCode==38 && (vm=vm+1), e.keyCode==40 && (vm=vm-1);  break;
            case 'd': e.keyCode==38 && (vd=vd+1), e.keyCode==40 && (vd=vd-1);  break;
            case 'h': e.keyCode==38 && (vh=vh+1), e.keyCode==40 && (vh=vh-1);  break;
            case 'i': e.keyCode==38 && (vi=vi+1), e.keyCode==40 && (vi=vi-1);  break;
            case 's': e.keyCode==38 && (vs=vs+1), e.keyCode==40 && (vs=vs-1);  break;
        }e.preventDefault();
        
        var fdate=new Date();
        fdate.setYear(vy);fdate.setMonth(vm);fdate.setDate(vd);
        if(h!=undefined){ fdate.setHours(vh);fdate.setMinutes(vi);fdate.setSeconds(vs); }
        
        var r,ty=fdate.getFullYear(),
            tm=`0${fdate.getMonth()+1}`.slice(-2),
            td=`0${fdate.getDate()}`.slice(-2);
        r=`${ty}-${tm}-${td}`
        if(h!=undefined){
            var th=`0${fdate.getHours()}`.slice(-2);
            ti=`0${fdate.getMinutes()}`.slice(-2);
            ts=`0${fdate.getSeconds()}`.slice(-2);
            r+=` ${th}:${ti}:${ts}`;
            [y.value,m.value,d.value]=r.split(' ')[0].split('-');
            [h.value,i.value,s.value]=r.split(' ')[1].split(':')
        }else{ 
            [y.value,m.value,d.value]=r.split('-'); 
        }
    },
    init_date:(el)=>{
        var val=el.querySelector(`input`),
            date=val.value,
            cont=PnM(`div`).classes('grid grid-cols-3').get(),
            y=PnM('input').id(`y_${val.name}`).classes('w-full').get(),
            m=PnM('input').id(`m_${val.name}`).classes('w-full').get(),
            d=PnM('input').id(`d_${val.name}`).classes('w-full').get();
            y.dataset.part="y";
            m.dataset.part="m";
            d.dataset.part="d";
        val.type="hidden";
        [y.value,m.value,d.value]=date.split('-');
        y.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus(); 
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d); }
            val.value=`${y.value}-${m.value}-${d.value}`;
        });
        m.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus(); 
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d); }
            val.value=`${y.value}-${m.value}-${d.value}`;
        });
        d.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus();
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d); }
            val.value=`${y.value}-${m.value}-${d.value}`;
        });
        y.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d); val.value=`${y.value}-${m.value}-${d.value}`; });
        m.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d); val.value=`${y.value}-${m.value}-${d.value}`; });
        d.addEventListener('blur',e=>{  evForm.mk_time(e,y,m,d); val.value=`${y.value}-${m.value}-${d.value}`; });
        el.removeChild(val);
        cont.append(y,m,d,val);
        el.append(cont);
    },
    init_datetime:(el)=>{
        var val=el.querySelector(`input`),
            date=val.value,
            cont=PnM(`div`).classes('grid grid-cols-3').get(),
            y=PnM('input').id(`y_${val.name}`).classes('w-full').get(),
            m=PnM('input').id(`m_${val.name}`).classes('w-full').get(),
            d=PnM('input').id(`d_${val.name}`).classes('w-full').get(),
            h=PnM('input').id(`h_${val.name}`).classes('w-full').get(),
            i=PnM('input').id(`i_${val.name}`).classes('w-full').get(),
            s=PnM('input').id(`s_${val.name}`).classes('w-full').get();
            y.dataset.part="y";
            m.dataset.part="m";
            d.dataset.part="d";
            h.dataset.part="h";
            i.dataset.part="i";
            s.dataset.part="s";
        val.type="hidden";
        [y.value,m.value,d.value]=date.split(' ')[0].split('-');
        [h.value,i.value,s.value]=date.split(' ')[1].split(':');
        y.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d,h,i,s); }
            val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`;
        });
        m.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d,h,i,s); }
            val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`;
        });
        d.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d,h,i,s); }
            val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`;
        });
        h.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d,h,i,s); }
            val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`;
        });
        i.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d,h,i,s); }
            val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`;
        });
        s.addEventListener('keyup',e=>{
            /*left*/ e.keyCode==37 && PnM(e.target).before().get().focus();
            /*right*/ e.keyCode==39 && PnM(e.target).next().get().focus(); 
            if (!parseInt(e.key) || e.keyCode==40 || e.keyCode==38) {  evForm.mk_time(e,y,m,d,h,i,s); }
            val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`;
        });
        y.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d,h,i,s); val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`; });
        m.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d,h,i,s); val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`; });
        d.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d,h,i,s); val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`; });
        h.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d,h,i,s); val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`; });
        i.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d,h,i,s); val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`; });
        s.addEventListener('blur',e=>{ evForm.mk_time(e,y,m,d,h,i,s); val.value=`${y.value}-${m.value}-${d.value} ${h.value}:${i.value}:${s.value}`; });
        el.removeChild(val);
        cont.append(y,m,d,h,i,s,val);
        el.append(cont);
    },
    isJson:(item) =>{
        let value = typeof item !== "string" ? JSON.stringify(item) : item;    
        try { value = JSON.parse(value); } catch (e) { return false; }
        return typeof value === "object" && value !== null;
    },
    init_dropdown:async (el)=>{
        var cont=el.querySelector(`div`),
            elLbl=cont.querySelector(`label`),
            elList=cont.querySelector(`ul`),
            elVal=cont.querySelector(`input[type='hidden']`),src;
            
        if(el.dataset.src!=undefined) { var raws=el.dataset.src;//console.log('a',typeof(raws),raws);
            if(raws.indexOf("http")==0){
                src=await (await request.get(el.dataset.src)).result; //console.log('b',src);
            } else if(evForm.isJson(raws)){ src=JSON.parse(raws);
            } else { src=LS.get(raws); }
        }
        src!=null && (elList.innerHTML=""), Object.keys(src).forEach((k)=>{ 
            var li=PnM('li').get(), a=PnM('a').get();
            a.href="#"; a.dataset.key=k; a.textContent=src[k];
            li.append(a);
            elList.append(li);
            a.addEventListener('click',(ev)=>{
                var ela=ev.target;
                elVal.value=ela.dataset.key;
                elLbl.textContent=ela.textContent;
                evForm.ultoggle(elList);
                PnM(elLbl).next().get().focus(); 
            });
        }), elVal.value!=="" && (elLbl.textContent=src[elVal.value]);
        cont.addEventListener('keydown', e=>{ 
            evForm.ulkeydown(e,elList); 
            e.keyCode==27 && elLbl.focus();
            [38,40,32,13,9,27].includes(e.keyCode)==false && (
                elLbl.focus(), evForm.ulfilter(elList,e)
            );
        });
        elLbl.addEventListener('keyup',e=>{  evForm.ulfilter(elList,e); });
    },
    init_complex:async(el)=>{
        var src;
        if(el.dataset.src!=undefined) { var raws=el.dataset.src;//console.log('a',typeof(raws),raws);
            if(raws.indexOf("http")==0){
                src=await (await request.get(el.dataset.src)).result; //console.log('b',src);
            } else if(evForm.isJson(raws)){ src=JSON.parse(raws);
            } else { src=LS.get(raws); }
        }//console.log('c',src);

        var cont=el.querySelector(`div`),
            elVal=cont.querySelector(`a`),
            eText=cont.querySelector(`input[type='text']`),
            elLbl=cont.querySelector(`label`),
            elList=cont.querySelector(`ul`);
        src!=null && (elList.innerHTML=""), Object.keys(src).forEach((k)=>{ 
            var li=PnM('li').get(), a=PnM('a').get();
            a.href="#"; a.dataset.key=k; a.textContent=src[k];
            elList.append(li);
            li.append(a);
            a.addEventListener('click',(ev)=>{
                var ela=ev.target;
                elVal.href=`#${ela.dataset.key}`;
                eText.value=elVal.dataset.value=ela.dataset.key;
                elLbl.textContent=elVal.textContent=ela.textContent;
                evForm.ultoggle(elList);
                elLbl.style.display="block";
                PnM(ela).next().get().focus(); 
            });
        }), eText.value!=="" && src[eText.value]!=undefined && (
            elLbl.textContent=src[eText.value],
            elVal.href=`#${eText.value}`,
            elVal.textContent=`${src[eText.value]}`
        );
        elList.style.top=`${cont.offsetHeight}px`; 
        cont.addEventListener('keydown', e=>{ 
            evForm.ulkeydown(e,elList); 
            e.keyCode==27 && eText.focus();
            [38,40,32,13,9,27].includes(e.keyCode)==false && (
                eText.focus(), evForm.ulfilter(elList,e)
            );
        });
        eText.addEventListener('keyup',ev=>{
            evForm.ulfilter(elList,ev);
        });
        elLbl.addEventListener('click',ev=>{
            eText.value=elLbl.textContent!=""?elLbl.textContent:eText.value;
            elLbl.style.display="none";
            eText.focus();
            elLbl.textContent="";
        });
        eText.addEventListener('focus',ev=>{
            eText.value=elLbl.textContent!=""?elLbl.textContent:eText.value;
            elLbl.style.display="none";
            eText.focus();
            elLbl.textContent="";
        });
    },
    init_autocomplete:async (el)=>{
        var cont=el.querySelector(`div`),
            elVal=cont.querySelector(`input[type='text']`),
            elList=cont.querySelector(`ul`),src;
        // el.dataset.src!=undefined && (src=LS.get(el.dataset.src))
        if(el.dataset.src!=undefined) { var raws=el.dataset.src;//console.log('a',typeof(raws),raws);
            if(raws.indexOf("http")==0){
                src=await (await request.get(el.dataset.src)).result; //console.log('b',src);
            } else if(evForm.isJson(raws)){ src=JSON.parse(raws);
            } else { src=LS.get(raws); }
        }
        src!=null && (elList.innerHTML=""), Object.keys(src).forEach((k,i)=>{ 
            var li=PnM('li').get(), a=PnM('a').get();
            a.href="#"; a.dataset.key=k; a.textContent=src[k];
            li.append(a);
            elList.append(li);
            a.addEventListener('click',(ev)=>{
                var lel=ev.target;
                elVal.value=lel.textContent;
                evForm.ultoggle(elList); 
                PnM(elVal).next().get().focus(); 
            });
        }), elVal.value!=="" && (elVal.textContent=src[elVal.value]);
        cont.addEventListener('keydown', e=>{ 
            evForm.ulkeydown(e,elList); 
            e.keyCode==27 && elVal.focus();
            [38,40,32,13,9,27].includes(e.keyCode)==false && (
                elVal.focus(), evForm.ulfilter(elList,e)
            );
        });
        elVal.addEventListener('keyup',e=>{  evForm.ulfilter(elList,e); });
        // elVal.addEventListener('click',e=>{ evForm.ultoggle(elList); });
    },
    init_multiselect:(el)=>{
        var val=el.querySelector(`input`),
            selection=PnM(`ul`).classes('flex gap-1').get(),
            opt=[],
            addval=(ev)=>{

            },
            remval=(ev)=>{

            };
        PnM(el.lastElementChild).classes('flex ml-2 border p-1').styles({'align-items':'baseline'});
        PnM(el.querySelector(`ul`)).classes('border-l border-t');
        el.querySelectorAll(`li`).forEach(li=>{ 
            PnM(li).classes('border-r border-b cursor-pointer px-1 text-slate-200');
            opt[li.dataset.value]=li.textContent;
            li.addEventListener('click',addval);
        });
        JSON.parse(val.value).forEach(v=>{
            var li=PnM(`li`).classes('flex border rounded-md').get(),
            lbl=PnM(`span`).text(opt[v]).get(),
            dismis=PnM('a').classes('cursor-pointer px-1 text-slate-200 hover:text-red-500').html('<i class="fa fa-times-circle"></i>').get(); 
            li.append(lbl,dismis);
            dismis.addEventListener('click',remval);
            selection.append(li);
        });
        el.lastElementChild.append(selection);
    }
}
function toQS(obj) {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([key, value]) => {
        params.append(key, value);
    });
    return params.toString();
}
export { toQS,SZO,MUT,LS,JWT,evForm };