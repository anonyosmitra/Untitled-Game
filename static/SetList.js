class SetList extends Set{
    constructor(lst=null) {
        super()
        if(lst!=null)
            lst.forEach(x=>this.add(x));
    }
    addAll(l){
        l.forEach(x=>this.add(x));
    }
    removeAll(l){
        l.forEach(x=>this.remove(x))
    }
    sort(f){
        return Array.from([...this]).sort(f);
    }
    filter(f){
        return new SetList([...this].filter(f));
    }
    forEach(f){
        return [...this].forEach(f);
    }
    length(){
        return this.size;
    }
    toList(){
        return Array.from([...this]);
    }
    toSet(){
        return new Set([...this]);
    }
    clear(){
        [...this].clear();
    }
    values(){
        return [...this].values();
    }
    slice(a,b,f=null){
        var l=Array.from([...this]);
        if(f!=null)
            l=l.sort(f);
        return l.slice(a,b);
    }
    replace(e1,e2){
        this.remove(e1);
        this.add(e2);
    }
    map(f){
        return Array.from([...this]).map(f);
    }
    find(f){
        var l=this.filter(f);
        if(l.length==0)
            return null;
        return l[0];
    }
    get(i,f=null){
        var lst=null;
        if(f!=null)
            lst=this.sort(f);
        else
            lst=this.toList();
        return lst[i];
    }
    pickRandom(remove=false){
        var v=Math.floor(Math.random() * this.length());
        v=this.get(v);
        if(remove)
            this.delete(v);
        return v;
    }
    deleteWhere(f){
        this.filter(f).forEach(x=>this.delete(x));
        return this;
    }
}