import {InM} from "./pnm_notif";
import {PnM} from "./pnm_elem";
import {request} from "./pnm_fetchy";
const MHDyna=function(d){
    var DD={
        cfg:{click:false,filter:true,conf:true,show:10,mode:'client'/*'server'*/,display:'pagination',datakey:'id',request_header:{}},
        operand:[{'<':'<'},{'>':'>'},{'<=':'<='},{'>=':'>='},{'==':'=='},{'!=':'!='},{'*':'contains'}],
        data:{},
        selected:[],
        triggerError:(error,type)=>{
            if(DD.cfg.onError != null){ DD.cfg.onError(error,type); }
            else{ 
                switch(type){
                    case 'error':console.log(error); break;
                    default: console.log(error); break;
                }
            }
        },
        init:()=>{
            DD.section==undefined && (DD.section={}),
                    DD.section.reloadBtn=PnM('a').html(`<i class="fas fa-redo"></i>`).get(),
                    DD.section.confBtn=PnM('a').html(`<i class="fas fa-cog"></i>`).get(),
                    DD.section.filterBtn=PnM('a').html(`<i class="fas fa-filter"></i>`).get(),
                DD.section.HACT=PnM('div').append(DD.section.reloadBtn,DD.section.confBtn).get(),
                DD.section.TITLE=PnM('h1').text(DD.cfg.title).get(),
            DD.section.HEAD=PnM('div').classes(`DynaHead`).append(DD.section.TITLE,DD.section.HACT).get(),

                DD.section.THEAD=PnM('thead').get(),
                DD.section.TBODY=PnM('tbody').get(),
            DD.section.Table=PnM('table').append(DD.section.THEAD,DD.section.TBODY).get(),
            DD.section.DFILTER=PnM('div').classes(`DynaFilt max-h-full overflow-scroll`).get(),
            DD.section.DCONF=PnM('div').classes(`DynaConf max-h-full overflow-scroll`).get(),
            DD.section.BODY=PnM('div').classes(`DynaBody`).append(DD.section.Table).get(),

                DD.section.LFOOT=PnM('div').get(),
                DD.section.RFOOT=PnM('div').get(),
            DD.section.FOOT=PnM('div').classes(`DynaFoot bg-sky-100`).append(DD.section.LFOOT,DD.section.RFOOT).get(),
            PnM(DD.cfg.EL).append(DD.section.HEAD, DD.section.BODY, DD.section.FOOT,DD.section.DFILTER,DD.section.DCONF),
            
            DD.cfg.fab!=null && (DD.cfg.fab.forEach(a=>{
                var faBtn=PnM('a').html(Object.keys(a)).get();
                faBtn.addEventListener('click',()=>{a[Object.keys(a)]();});
                DD.section.RFOOT.append(faBtn);
            }));
            DD.section.reloadBtn.addEventListener('click', DD.load);
            DD.load().then(z=>{ DD.render(); })
        },
        render:()=>{
            DD.cfg.conf && DD.Plot_Conf();
            DD.cfg.filter && DD.Plot_Filt();
            DD.cfg.hab!=null && (DD.cfg.hab.forEach(a=>{
                var haBtn=PnM('a').html(Object.keys(a)).get();
                haBtn.addEventListener('click',()=>{a[Object.keys(a)]();});
                DD.section.HACT.append(haBtn);
            }));
            if(DD.cfg.display=="pagination"){
                var fsBtn=PnM('a').html(`<i class="fa fa-xs fa-step-backward"></i>`).get(),
                prBtn=PnM('a').html(`<i class="fa fa-xs fa-backward"></i>`).get(),
                page=PnM('input').classes('w-10').get(),
                nxBtn=PnM('a').html(`<i class="fa fa-xs fa-forward"></i>`).get(),
                lsBtn=PnM('a').html(`<i class="fa fa-xs fa-step-forward"></i>`).get(),
                fdesc=PnM('span').classes(`${DD.cfg.EL.id}_desc`).get();
                DD.section.LFOOT.append(fsBtn,prBtn,page,nxBtn,lsBtn,fdesc);
                page.value=DD.cfg.curpage;
                fsBtn.addEventListener('click',e=>{
                    DD.cfg.curpage=1, page.value=DD.cfg.curpage, DD.Table_Draw();
                });
                nxBtn.addEventListener('click',e=>{
                    DD.cfg.curpage=DD.cfg.curpage+1, page.value=DD.cfg.curpage, DD.Table_Draw();
                });
                prBtn.addEventListener('click',e=>{
                    DD.cfg.curpage=DD.cfg.curpage-1, page.value=DD.cfg.curpage, DD.Table_Draw();
                });
                lsBtn.addEventListener('click',e=>{
                    DD.cfg.curpage=Math.ceil(DD.data.length/DD.cfg.show), page.value=DD.cfg.curpage, DD.Table_Draw();
                });
            }else{
                var nxBtn=PnM('a').html(`Load More`).get(),
                fdesc=PnM('span').classes(`${DD.cfg.EL.id}_desc`).get();
                DD.section.LFOOT.append(nxBtn,fdesc);
                nxBtn.addEventListener('click',e=>{
                    DD.cfg.curpage=DD.cfg.curpage+1, DD.Table_Draw();
                });
            }
        },
        Plot_Conf:()=>{
            var F_perpage=PnM('select').classes('py-0 ml-1').get(),
                F_lblpage=PnM('label').text('Rows each load').classes('text-white pl-2').get(),
            HP=PnM('div').append(F_lblpage,F_perpage).classes('flex justify-between items-center bg-slate-700 mb-1').get(),
            page_change=(el)=>{ DD.cfg.show=(el.target).value, DD.Table_Draw() },
                CH=PnM('h1').text("Column Display").classes('text-white px-2 py-0').get(),
            HC=PnM('div').append(CH).classes('flex justify-between items-center bg-slate-700').get(),
            cont_COL=PnM('div').classes(`grid gap-1 items-center border-b mb-1`)
                .styles({'grid-template-columns':'auto minmax(0,1fr)'}).get(),
            
            SH=PnM('h1').text("Selected").classes('bg-slate-700 text-white px-2 py-0').get(),
            cont_SEL=PnM('div').id(`${DD.cfg.EL.id}_selected`).classes('flex flex-col flex-wrap border').get(),
            tblReload=(el)=>{
                DD.visibleCols=[]
                , (el.target).parentElement.querySelectorAll('[type=checkbox]:checked')
                    .forEach(c=>{ c.checked && DD.visibleCols.push(c.dataset.col); })
                , DD.Table_Draw()
            };
            DD.section.DCONF.append(HP, HC,cont_COL, SH,cont_SEL)
            
            DD.headers.forEach(x=>{
                let cc=PnM('input').classes(`${DD.cfg.EL.id}_cols`).attr({"type":'checkbox', "data-col":`${x}`,"checked":""}).get();
                PnM(cont_COL).append(cc).appendhtml(`<span>${x}</span>`);
            });
            document.querySelectorAll(`.${DD.cfg.EL.id}_cols`).forEach(cc=>{ cc.addEventListener('click',tblReload); });
            [10,20,50,100].forEach(x=>{ 
                PnM(F_perpage).appendhtml(`<option ${DD.cfg.show==x?'selected':''}>${x}</option>`); 
            });
            F_perpage.addEventListener('change',page_change);

            DD.section.confBtn.addEventListener('click',ev=>{
                DD.section.DFILTER.classList.contains('show') && PnM(DD.section.DFILTER).toggle('show');
                PnM(DD.section.DCONF).toggle('show');
            });
        },
        Plot_Filt:()=>{
            var FH=PnM('h1').text("Filter").classes('text-white bg-slate-700 px-2 py-0').get(),
                ff_col=PnM('select').attr({'name':`${DD.cfg.EL.id}_column`}).classes('basis-full p-0 px-2').get(),
                ff_opr=PnM('select').attr({'name':`${DD.cfg.EL.id}_operand`}).classes('basis-1/4 p-0 px-2 w-1/4').get(),
                ff_val=PnM('input').attr({'name':`${DD.cfg.EL.id}_value`}).classes('basis-1/2 px-1 border w-1/2').id('cv').get(),
                ff_add=PnM('a').classes('btn basis-1/4 w-max bg-blue-400 hover:bg-blue-500 px-2 text-white').text('add').get(),
            F_frm=PnM('div').classes('flex flex-wrap flex-row border text-left')
                .append(ff_col, ff_opr, ff_val, ff_add).get(),
            F_cont=PnM('div').classes(`${DD.cfg.EL.id}_flist border grid grid-cols-3`).get();

            DD.headers.forEach(x=>{ PnM(ff_col).appendhtml(`<option>${x}</option>`); });
            DD.operand.forEach(c=>{
                var ok=Object.keys(c);
                PnM(ff_opr).appendhtml(`<option value='${ok}'>${c[ok]}</option>`);
            });
            DD.section.DFILTER.append(FH, F_frm, F_cont);
            DD.section.HACT.append(DD.section.filterBtn);
            DD.section.filterBtn.addEventListener('click',ev=>{
                DD.section.DCONF.classList.contains('show') && PnM(DD.section.DCONF).toggle('show');
                PnM(DD.section.DFILTER).toggle('show');
                // var fel=Dfilt;//(ev.target).parentElement.parentElement.nextSibling;
                // if(fel.classList.contains('show')){fel.classList.remove('show')}else{fel.classList.add('show');}
            });
            ff_add.addEventListener('click',ev=>{
                DD.ColumnFilter_Draw(ff_col.value, ff_opr.value, ff_val.value);
            });
        },
        load:async ()=>{
            // DD.cfg.colfilter!=undefined && (console.log(DD.cfg.colfilter),);
            if(DD.cfg.mode == 'client' && DD.data.length != undefined){
                DD.ondata == undefined && (DD.ondata=DD.data);
                d.r = DD.ondata.filter(i=>{
                    var rf=true;
                    Object.keys(DD.cfg.colfilter).forEach(k=>{
                        var f=DD.cfg.colfilter[k];
                        try{
                            switch(f.operand){
                                case '<': rf=rf && i[f.column] < f.value; break;
                                case '>': rf=rf && i[f.column] > f.value; break;
                                case '<=': rf=rf && i[f.column] <= f.value; break;
                                case '>=': rf=rf && i[f.column] >= f.value; break;
                                case '==': rf=rf && i[f.column] == f.value; break;
                                case '!=': rf=rf && i[f.column] !== f.value; break;
                                default: rf=rf && i[f.column].indexOf(f.value) >=0; break;
                            }
                        }catch(e){ DD.triggerError(`some error: ${e}`,'error'); }
                    }); return rf;
                });
            }else{
                InM.sync('Loading Data..');
                var param={};
                DD.cfg.colfilter!=null && Object.keys(DD.cfg.colfilter).forEach(k=>{
                    var f=DD.cfg.colfilter[k];
                    param[f.column]=`${f.operand}${f.value}`;
                })
                try{
                    d= await (await request(DD.cfg.url).header(DD.cfg.request_header).post(param)); 
                    if(d.code>400){ DD.triggerError(d,'error');  }
                    d=d.result;
                    d.T!=undefined && (delete d.T);
                }catch(e){ DD.triggerError(`some error: ${e}`,'error');}
                InM.sync();
            }
            DD.data=d.r!=undefined? d.r : d;
            DD.datacount=d.c!=undefined? d.c : d.length;
            DD.headers==undefined && ( DD.headers=[] );
            DD.data.length>0 && (
                DD.headers=Object.keys(DD.data[0]),
                DD.Table_Draw()
            )
        },
        Table_Draw:()=>{
            var thc=PnM('tr').html(`<th><textarea disabled class="text-slate-400 w-10">#</textarea></th>`).get();
            PnM(DD.section.THEAD).html(""), 
            DD.visibleCols==undefined && (DD.visibleCols=DD.headers),
            DD.cfg.datakey= (DD.headers.indexOf(DD.cfg.datakey)>=0) ? DD.cfg.datakey : false,
            DD.headers.forEach(x=>{
                DD.visibleCols.indexOf(x)>=0 && 
                ( thc.innerHTML+=`<th><textarea disabled>${x.toUpperCase()}</textarea></th>` )
            }),  DD.section.THEAD.append(thc),
            PnM(DD.section.THEAD).get().querySelectorAll('textarea').forEach(el=>{ 
                DD.colsize.observe(el); /*DD.Table_fixdisp(el)*/ 
            });
            DD.cfg.display=="pagination" && PnM(DD.section.TBODY).html("");

            DD.cfg.curpage==undefined && (DD.cfg.curpage=1) 
            var dstart=DD.cfg.show*(DD.cfg.curpage-1),
                dend=parseInt(dstart)+parseInt(DD.cfg.show),
                cd=DD.data.slice(dstart, dend);
            dstart<0 && (dstart=0);
            dend>DD.data.length && (dend=DD.data.length);
            PnM(`.${DD.cfg.EL.id}_desc`).el !=null && ( 
                PnM(`.${DD.cfg.EL.id}_desc`).text(`rec ${dstart+1}-${dend} / ${DD.data.length}`)
            )
            var dnum=dstart+1;
            cd.forEach(y=>{
                var Trow=document.createElement('tr'),
                    d_key=y[DD.cfg.datakey];
                DD.section.TBODY.append(Trow),
                DD.cfg.datakey!=false && Trow.setAttribute('data-id',d_key);
                Object.keys(DD.selected).indexOf(d_key) >=0 && PnM(Trow).classes('selected');
                Trow.innerHTML+=`<td class="text-slate-400">${dnum}</td>`;dnum++;
                DD.headers.forEach(att=>{ 
                    DD.visibleCols.indexOf(att)>=0 &&
                    (Trow.innerHTML+=`<td>${y[att]}</td>`); 
                });
                typeof(DD.cfg.click)=='function' && (
                    Trow.addEventListener('click',()=>{ DD.cfg.click(y); })
                );
                Trow.addEventListener('contextmenu', (ev)=> {
                    ev.preventDefault();
                    if(Trow.classList.contains('selected') ){
                        Object.keys(DD.selected).indexOf(d_key) >=0 && 
                        (delete DD.selected[d_key] );
                    }else{
                        if(DD.cfg.datakey!=false){ DD.selected[d_key]=y; }
                        else{ DD.selected[JSON.stringify(y)]=y; }
                    }
                    PnM(Trow).toggle('selected'), DD.selected_Draw();
                });
            })
        },
        Table_fixdisp:(ta)=>{
            var th=ta.parentElement, idx = th.cellIndex;
            (ta.style.width=window.getComputedStyle(th).width);
            PnM(DD.section.TBODY).get().querySelectorAll(`tr`).forEach(es=>{
                es.children[idx]!=undefined && (es.children[idx].style.width=ta.style.width);
            });
        },
        colsize:new ResizeObserver(x=>{ x.forEach(ta=>{ DD.Table_fixdisp(ta.target); }); }),
        selected_Draw:()=>{
            var PnMel=PnM(`#${DD.cfg.EL.id}_selected`).html("");
            Object.keys(DD.selected).forEach(i=>{
                var c=PnM('a').text('x').attr({'data-trid':i})
                        .classes('btn w-fit h-fit rounded-xl border text-xs px-1 bg-black text-white hover:bg-red-300').get()
                    ,r=PnM('div').text(JSON.stringify(DD.selected[i])).styles({'max-width':'20em'})
                        .classes('w-fit max-w-full whitespace-nowrap text-ellipsis overflow-hidden').get(),
                    d=PnM('div').classes('flex').append(r,c).get();
                PnMel.append(d);
            }); 
            PnMel.get().querySelectorAll('a').forEach(y=>{
                y.addEventListener('click',e=>{ var c=(e.target);
                    PnM(`#${DD.cfg.EL.id} [data-id="${c.dataset.trid}"]`).toggle('selected');
                    delete DD.selected[c.dataset.trid]; c.parentElement.remove();
                })
            });
        },
        ColumnFilter_Draw:(c,o,v)=>{
            DD.cfg.colfilter==null && (DD.cfg.colfilter=[]);
            DD.cfg.colfilter[`${c+o}`]={'column':c,'operand':o,'value':v};
            var PnMel=PnM(`.${DD.cfg.EL.id}_flist`).html("");
            Object.keys(DD.cfg.colfilter).forEach(f=>{
                var dat=DD.cfg.colfilter[f],
                r=PnM('a').text('x').attr({'data-id':f})
                    .classes('btn w-fit h-fit rounded-xl border text-xs px-1 bg-black text-white hover:bg-red-300').get(),
                d=PnM('div').html(`<span>${dat.column} ${dat.operand} ${dat.value}</span>${r.outerHTML}`)
                    .classes('flex justify-start w-fit border rounded-md gap-1').get();
                PnMel.append(d);
            });
            PnM(DD.section.TBODY).html(""); DD.cfg.curpage=undefined;
            DD.load();
            PnMel.get().querySelectorAll('a').forEach(y=>{
                y.addEventListener('click',e=>{ var c=(e.target);
                    delete DD.cfg.colfilter[c.dataset.id]; c.parentElement.remove();
                    PnM(DD.section.TBODY).html(""); DD.cfg.curpage=undefined;
                    DD.load();
                })
            });
        }
    };
    d.EL=this, PnM(d.EL).classAdd("DynaTable");
    d.EL.Dyna=DD;
    d.EL.dataset.title!=undefined && (DD.cfg.title=d.EL.dataset.title),
    d.EL.dataset.url!=undefined && (DD.cfg.url=d.EL.dataset.url),
    d.EL.dataset.click!=undefined && typeof(window[d.EL.dataset.click])!=undefined 
        && (DD.cfg.click=window[d.EL.dataset.click]),
    d.EL.dataset.datakey!=undefined && (DD.cfg.datakey=d.EL.dataset.datakey),
    d.EL.dataset.filter!=undefined && ( DD.cfg.filter=d.EL.dataset.filter),
    d.EL.dataset.conf!=undefined && ( DD.cfg.conf=d.EL.dataset.conf),
    d.EL.dataset.show!=undefined && ( DD.cfg.show=d.EL.dataset.show),
    // d.EL.dataset.pagination!=undefined && (DD.cfg.pagination=d.EL.dataset.pagination)
    d.EL.dataset.display!=undefined && (
        ["partials","pagination"].indexOf(d.EL.dataset.display) < 0 && (console.log(`display strategy using ${DD.cfg.display}`)),
        ["partials","pagination"].indexOf(d.EL.dataset.display) >= 0 
            && ( DD.cfg.display=d.EL.dataset.display)
    )
    d.EL.dataset.mode!=undefined && (DD.cfg.mode=d.EL.dataset.mode)  ;
    DD.cfg=Object.assign(DD.cfg, d);
    this.id==undefined && alert('dynatable element must have id');
    DD.cfg.EL.id!=undefined && DD.init();
}
// window.MHDyna=MHDyna;

export {MHDyna};
