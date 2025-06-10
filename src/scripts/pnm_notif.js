import {evForm} from "./script.js";
import {PnM} from "./pnm_elem.js";
const _Interact={
    ids:{
        sync_disp:'disp_notif_sync',
        stack_disp:'disp_notif_stack',
        flash_disp:'disp_notif_flash'
    },
    zindex:31,
    classes:{
        flash_wrapper:'fixed cursor-pointer animated fadeInRight bg-black/20 p-0 pl-1 py-1',
        flash_content:'text-center p-1 pl-2 pr-5 border bg-white',
        stack_wrapper:'fixed flex justify-between gap-3 bg-black/90 white-text p-2 animated fadeInRight',
        stack_dismiss:'cursor-pointer text-white hover:text-red-500 hover:text-sm',
        wrapper:'modal show justify-between text-white bg-black/70 animated',
        dismiss:'m-2 self-end cursor-pointer text-white hover:text-red-500 hover:text-sm',
        content:'content flex mt-3 p-3 w-full max-h-full overflow-scroll'
    },
    modal:(content,anch="")=>{
        anch=="" && (anch="body");
        var zindex=31;
        var S4 = function() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        },id=(S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        PnM('body').lastz()>=zindex && (zindex=PnM('body').lastz()+1);
        var el=document.querySelector(anch),
        range=document.createRange(),
        wrapp=PnM('div').id(`M${id}`).classes('modal show').styles({'z-index':zindex}).get(),
        cont=PnM('div').classes('content').html(content).get();
        range.selectNode(el);
        wrapp.append(cont);
        var r=range.createContextualFragment(wrapp.outerHTML);
        el.appendChild(r);
        var sel=`#M${id}`;
        document.querySelector(sel).addEventListener('click',e=>{
            var el=e.target;
            if(el.classList.contains('modal')){
                if(el.classList.contains('show')){
                    el.remove(); // el.classList.remove('show');
                }else { el.classList.add('show'); }
            }
        });
        evForm.init(sel);
    },
    flash:function(val){
        var selid=_Interact.ids.flash_disp,wrap,cont;
        PnM('body').lastz()>=_Interact.zindex && (_Interact.zindex=PnM('body').lastz()+1);
        if(document.querySelector(`#${selid}`)==null){
            wrap=PnM('div').id(selid).classes(_Interact.classes.flash_wrapper).styles({'z-index': _Interact.zindex,'bottom': '1%','right': '0','border-top-left-radius': '15px'}).get(); 
            cont=PnM('div').classes(_Interact.classes.flash_content).styles({'border-top-left-radius': '10px'})
                .html(`<span><b>${val}</b></span>`).get();
            wrap.append(cont);
            document.querySelector("body").append(wrap); 
        }
        wrap.addEventListener('click',()=>{
            var el=document.querySelector(`#${selid}`);
            setTimeout(()=>{el.classList.add('fadeOutRight');},500);
            setTimeout(()=>{el.remove();},1000);
        });
    },
    stack:function(say,im){
        var selid=_Interact.ids.stack_disp;
        PnM('body').lastz()>=_Interact.zindex && (_Interact.zindex=PnM('body').lastz()+1);
        if(typeof say==="undefined"){ document.querySelector(`#${selid}`).remove(); return say; }
        typeof im=="undefined" && (im="") && (im=im.toLowerCase());
        var spinner=document.createElement('i'), txcolor="";
        switch(im){
            case "load": txcolor="text-green-500"; spinner.className='fa fa-spinner fa-spin'; break;
            case "info": txcolor="text-blue-500 "; spinner.className='fa fa-info-circle ico-pulsate'; break;
            case "error": txcolor="text-red-500"; spinner.className='fa fa-exclamation-circle ico-boing'; break;
            default: spinner.className='fa fa-check-circle';break;
        }
        if(im==""){
            setTimeout(()=>{document.querySelector(`#${selid}`).classList.add('fadeOutRight');},3000);
            setTimeout(()=>{document.querySelector(`#${selid}`).remove();},3500);
        }
        if(document.querySelector(`#${selid}`)==null){
            var temp=PnM('div').id(selid).classes(_Interact.classes.stack_wrapper)
                .styles({'z-index':_Interact.zindex,'top':'2.75em', 'right':'.4em', 'left':'auto', "border": "1px solid #CCC"}).get();
            var dms=PnM('a').classes(_Interact.classes.stack_dismiss).attr({"onclick":`document.querySelector('#${selid}').remove()`})
                .html('<i class="fa fa-times-circle"></i>').get();
            var cont=PnM('div').classes('flex flex-col gap-1')
                .appendhtml(`<div class='flex ${txcolor} items-center gap-2'>${spinner.outerHTML}${say}</div>`).get();
            temp.append(cont,dms);
            document.querySelector("body").append(temp);
        }else{ 
            var und=PnM('div').classes(`flex ${txcolor} items-center gap-2`).get();
            und.append(spinner,say);
            document.querySelector(`#${selid}`).childNodes[0].prepend(und);
        }
    },
    sync:function(msg){
        var selid=_Interact.ids.sync_disp;
        PnM('body').lastz()>=_Interact.zindex && (_Interact.zindex=PnM('body').lastz()+1);
        if(typeof msg==="undefined"){ 
            setTimeout(()=>{document.querySelector(`#${selid}`).classList.add('fadeOut');},300);
            setTimeout(()=>{document.querySelector(`#${selid}`).remove();},600);
            return msg; 
        }
        if(document.querySelector(`#${selid}`) == null){
            var temp=PnM('div').id(selid).classes(_Interact.classes.wrapper).styles({'z-index':_Interact.zindex}).get();
            var dismiss=PnM('a').classes(_Interact.classes.dismiss).attr({"onclick":`document.querySelector('#${selid}').remove()`})
                .html('<i class="fa fa-2x fa-times-circle"></i>').get();
            var spinner=PnM('i').classes('fa fa-8x fa-spinner fa-spin').get();
            var content=PnM('div').classes(_Interact.classes.content).styles({'background-color':'unset'})
                .html(msg).get();
            temp.append(dismiss, spinner, content);
            document.querySelector("body").append(temp);
        }else{ 
            var ELM=document.querySelector(`#${selid}`);
            ELM.lastChild.innerHTML= `${msg}<br>`+ELM.lastChild.innerHTML;  
        }
    },
};
const InM=_Interact;
export {InM};