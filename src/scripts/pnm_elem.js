class _ELEM{
    constructor(sel){ 
        switch(typeof(sel)){
            case "string": (document.querySelector(sel)!=null && document.querySelectorAll(sel).length==1)
            || ['body','nav','main','header','footer'].indexOf(sel) >=0 
            || ['#','.','['].indexOf(sel.substring(0,1)) >= 0
            || sel.indexOf('>') >= 0
                ? this.el=document.querySelector(sel)
                : this.el=document.createElement(sel);  break;
            default: this.el=sel; break;
        }
    }
    get(){return this.el;}
    toggle(cls){
        if(this.el.classList.contains(cls)){ this.el.classList.remove(cls); }else{ this.el.classList.add(cls);}
        return this;
    }
    id(i){ this.el.id=i; return this; }
    attr(at){ Object.keys(at).forEach(v=>{ this.el.setAttribute(v,at[v]); }); return this; }
    classes(l){ this.el.className=l; return this; }
    classAdd(l){ this.el.classList.add(l); return this; }
    classRem(l){ this.el.classList.remove(l); return this; }
    styles(styles){ Object.keys(styles).forEach(v=>{ this.el.style[v]=styles[v]; }); return this; }
    text(t){ this.el.textContent=t; return this; }
    html(h){ this.el.innerHTML=h; return this; }
    appendtext(t){ this.el.textContent+=t; return this; }
    appendhtml(h){ this.el.innerHTML+=h; return this; }
    append(...args){ args.forEach(e=>{this.el.append(e);}); return this;}
    prepend(...args){ args.forEach(e=>{this.el.prepend(e);}); return this;}
    strip(selector){
        if(typeof(selector)=="object"){
            selector.forEach(s=>{
                this.el.querySelectorAll(s).forEach(l=>{ l.remove(); });        
            });
        }else{ this.el.querySelectorAll(selector).forEach(l=>{ l.remove(); }); }
        return this;
    }
    lastz(){ 
        return window.getComputedStyle(this.el.lastElementChild).zIndex*1;  
    }
    next(){
        var fm=this.el.form!=null?this.el.form: document;
        fm=fm.querySelectorAll("a,label[contenteditable=true],input,select,textarea");
        var index = Array.prototype.indexOf.call(fm, this.el);
        this.el=(index+1)==fm.length? fm.item(0) : fm.item(index + 1);
        if(this.el.type=="hidden" || this.el.readOnly==true || this.el.checkVisibility()==false){ this.next(); }
        return this;
    }
    before(){
        var fm=this.el.form!=null?this.el.form: document;
        fm=fm.querySelectorAll("a,label[contenteditable=true],input,select,textarea");
        var index = Array.prototype.indexOf.call(fm, this.el);
        this.el=(index-1)<0 ? fm.item(fm.length-1) : fm.item(index - 1);
        if(this.el.type=="hidden" || this.el.readOnly==true|| this.el.checkVisibility()==false){ this.before(); }
        return this;
    }
}
const PnM=(i)=>{return new _ELEM(i);}
export {PnM};