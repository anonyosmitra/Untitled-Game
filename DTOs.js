const SetList = require('./SetList.js')
class UserList extends SetList{
    constructor() {
        super();
    }
    findById(id){
        var s=this.filter(x=>x.id==id);
        if(s.length()==0)
            return null;
        return s.get(0);
    }
    remove(id){
        var u=this.findById(id);
        if(u!=null)
            [...this].remove(u);
    }
    toString(){
        return [...this].toSet();
    }
}
class Game{
    static games=new SetList();
    static counter=1000;
    static async newGame(con){
        var gm=new Game(Game.counter++);
        await con.insert("untitled","Games",{id:gm.id,players:[]});
        Game.games.add(gm);
        return gm;
    }
    static async loadGames(con){
        var games=await con.find("untitled","Games",{});
        games.forEach(x=> {
            var gm = new Game(x.id)
            Game.games.add(gm);
            if (x.id >= Game.counter)
                Game.counter = x.id + 1;
            if(x.players.length>0)
                x.players.forEach(i => {
                    var usr = DTOs.users.findById(i.id);
                    usr.games.add(gm);
                    gm.players.add(new Player(usr.id, i.name, null, gm, i.color));
                    gm.AvailColors.delete(i.color);
                });
        });
    }
    constructor(id,players=null) {
        this.id=id;
        this.AvailColors=new SetList(["yellow","green","purple","aqua","red","pink","orange"]);
        this.players=new UserList();
        Game.games.add(this);
    }
    async addPlayer(con,usr,name){
        if((new SetList(this.players.map(x=>x.name))).has(name))
            return false;
        usr.games.add(this);
        var col=this.AvailColors.get(Math.floor(Math.random() * this.AvailColors.length()));
        console.log(col);
        this.AvailColors.delete(col);
        var pl=new Player(usr.id,name,null,this,col);
        this.players.add(pl);
        await con.update("untitled","Games",{"id":this.id},{"players":Player.getJSON(this.players)});
        return pl;
    }
    static findById(id){
        var s=Game.games.filter(x=>x.id==id);
        if(s.length()==0)
            return null;
        return s.get(0);
    }
    static findByPlayer(id){
        var s=Game.games.filter(x=>(Array.from(x.players).filter(p=>p.id==id).length)!=0);
        if(s.length()==0)
            return null;
        return s;
    }
}
//TODO: Create user with cookies and attach multiple games to the user
class DTOs {
    static users=new UserList();
    static counter=1;
    static async loadUsers(con){
        var co=0;
        await con.find("untitled","Players",{},(x)=>{
            x.forEach((i)=>{
                DTOs.users.add(new DTOs(i["id"]));
                co+=1;
                if(i["id"]>=DTOs.counter)
                    DTOs.counter=i["id"]+1;
            }) ;
        });
    }
    static async newUser(con,ret=null){
        var usr=new DTOs(DTOs.counter++);
        DTOs.users.add(usr);
        await con.insert("untitled","Players",usr);
        if(ret==null)
            return usr;
        return ret(usr);
    }
    constructor(id) {
        this.id=id;
        this.games=new SetList();
    }
    getGameIds(){
        return this.games.map(x=>x.id);
    }
    getPlayerTags(){
        var lst=new SetList();
        this.games.forEach(g=>g.players.filter(p=>p.id==this.id).forEach(p=>lst.add(p)));
        return lst;
    }
}
class Player extends DTOs{
    constructor(id,name,ws,game,color=null){
        super(id);
        this.name=name;
        this.game=game;
        if(typeof game=="number")
            this.game=Game.findById(game);
        this.color=color;
    }
    static getJSON(lst){
        return lst.map(x=>{return {"id":x.id, "name":x.name, "color":x.color}});
    }
}
module.exports = {User: DTOs,Game,UserList};