const SetList = require('./SetList.js')
const bcrypt = require('bcrypt');
const {GameData} = require('./GameData.js')
const Connection = require('./MongoConnection')
const {static} = require("express");
class UserList extends SetList{
    constructor() {
        super();
    }
    findByName(name){
        var s=this.filter(x=>x.name==name);
        if(s.length()==0)
            return null
        return s.get(0);
    }
    findById(id){
        if(id.constructor.name=="String")
            id=parseInt(id);
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
class User{
    static users=new UserList();
    static counter=1;
    constructor(id,username,pass,games) {
        this.id=id;
        this.name=username
        this.pass=pass;
        this.games=games;//<players>
    }
    static async loadUsers(con){
        var data=await con.find("untitled","Users",{});
        data.forEach(x=>{
           User.users.add(new User(x.id,x.name,x.pass,new SetList()));
           if(User.counter<=x.id)
               User.counter=x.id+1;
        });
    }
    async checkPassword(password){
        return await bcrypt.compare(password,this.pass)
    }
    getGameIds(){
        return this.games.map(x=>x.game.id);
    }
    static async newUser(name,password,con){
        if(this.users.filter(u=>u.name.toLowerCase()==name.toLowerCase()).length()>0)
            return "Username already exists"
        password=await bcrypt.hash(password,10)
        var usr=new User(User.counter++,name,password,new SetList());
        await con.insert("untitled","Users",{id:usr.id,name:usr.name,pass:usr.pass});
        User.users.add(usr);
        return usr;
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class Chat{
    static counter=1
    static chats=new SetList()
    constructor(id,game,participants,name=null){
        this.id=id;
        this.game=game;
        this.participants=participants;
        this.name=name;
        this.data=null;
        Chat.chats.add(this);
    }
    async getChats(){
        var ch=this.toJson()
        ch.data=[]
        this.data.forEach(d=>{
            ch.data.push(d.toJson());
        });
        console.log(ch)
        return ch
    }
    static async getChatsFor(player){
        var data=new SetList()
        var chts=Chat.chats.filter(c=>(c.game==player.game)&&(c.participants.has(player)));
        while(chts.length()>0 && chts.get(0).data==null)
            await sleep(500);
        console.log("Chats: "+chts.length())
        await chts.forEach(c=>{
            c.getChats().then(d=>data.add(d));
            return true
        })
        console.log(data)
        return data.toList()
    }
    static async getChatsForGame(game){
        var chts=Chat.chats.filter(c=>(c.game==game));
        return chts;
    }
    static async loadChats(con){
        var data=await con.find("untitled","Chats",{});
        data.forEach(c=>{
           var game=Game.games.filter(g=>g.id==c.game).get(0);
           var part=new SetList()
           c.participants.forEach(x=>{
               var p=game.players.filter(p=>p.user.id==x).get(0);
               part.add(p);
           });
            new Chat(c.id,game,part,c.name);
           if(c.id>=Chat.counter)
               Chat.counter=c.id+1;
        });
    }
    async addParticipant(players,con){
        if(players.constructor.name=="Player")
            players=[players]
        players.forEach(p=>{
            this.participants.add(p)
            console.log("adding "+p.name+" to chat "+this.id)
        })
        var payload=this.toJson();
        await con.update("untitled","Chats",{id:payload.id},{participants:payload.participants})
        //TODO: Notify players
    }
    static findById(id){
        var chat=Chat.chats.filter(c=>c.id==id)
        if(chat.length()==0)
            return null
        else
            return chat.get(0)
    }
    static async loadFor(game,con){
        Chat.chats.filter(c=>c.game==game).forEach(c=>Message.loadChat(c,con))
    }
    static async newChat(game,participants,con,name=null){
        if(name!=null) {
            if ((game.players.filter(p => (p.name.toLowerCase() == name.toLowerCase())).length>0) ||((await Chat.getChatsForGame(game)).filter(c=>(c.name!=null && c.name.toLowerCase()==name.toLowerCase())).length()>0))
                return "Name Already Exists"
        }
        var chat=new Chat(Chat.counter++,game,participants,name)
        await con.insert("untitled","Chats",chat.toJson());
        await con.insert("untitled","Messages",{id:chat.id,data:[]});
        return chat;
    }
    async onMessage(player,msg){
        if(this.participants.has(player)) {
            var message = await new Message(this, player, msg);
            var pay=[{"action":"receiveMsg",data:message.toJson()}]
            this.participants.forEach(p=>{
                if(p.sock!=null)
                    p.sock.send(pay);
            })
        }
    }
    async save(con){
        var d=[]
        await this.data.forEach(m=>d.push(m.toJson()));
        await con.update("untitled","Messages",{id:this.id},{data:d})
        this.data=null;
    }
    toJson(){
        return {id:this.id,name:this.name,game:this.game.id,participants:this.participants.map(p=>p.user.id)}
    }
}
class Message{
    static async loadChat(chat,con){
        var data=await con.find("untitled","Messages",{id:chat.id})
        data=data[0].data
        chat.data=new SetList();
        data.forEach(m=>{
            var sender=(chat.game.players.filter(p=>p.user.id==m.sender)).get(0)
            new Message(chat,sender,m.msg,m.time);
        });
    }
    toJson(){
        return{chat:this.chat.id,sender:this.sender.user.id,msg:this.msg,time:this.time}
    }
    constructor(chat,sender,msg,time=null) {
        if(time==null)
            time=new Date();
        this.chat=chat;
        this.time=time;
        this.sender=sender;
        this.msg=msg;
        chat.data.add(this);
    }
}
class Game{
    static games=new SetList();
    static counter=1000;
    static con=null;
    constructor(id,players,gd,avail=0) {
        this.id=id;
        this.data=null;//GameData obj
        this.avail=avail;//this.data.getAvailable()
        this.AvailColors=new SetList(["yellow","green","purple","aqua","red","pink","orange"]);
        this.players=players;
    }
    setGameData(data){
        this.data=data;
        this.avail=this.data.getAvailable();
    }
    async save(){
        await (this.players.filter(p=>p.sock!=null)).forEach(p=>p.sock.send({action:"Closing Server"}))
        this.data.saveGame(Game.con).then(async x => {
            Chat.chats.filter(c => (c.game.id == this.id && c.data != null)).forEach(async(c) => await c.save(Game.con));
            delete this.data;
            this.data = null;
        })
    }
    async load(){
        if(this.data==null) {
            this.setGameData(await GameData.retrieveGame(Game.con, this));
            await Chat.loadFor(this, Game.con)
        }
        return this.data;
    }
    static async loadGames(con){
        Game.con=con;
        var data=await con.find("untitled","Games",{});
        data.forEach(x=>{
           var gm=new Game(x.id,new SetList(),null,x.avail);
           Game.games.add(gm);
           x.players=new SetList(x.players)
           if(x.players.length()!=0) {
               x.players.forEach(p => {
                   var usr = User.users.findById(p.user);
                   var plr = new Player(usr, gm, p.name, p.color);
                   gm.AvailColors.delete(p.color);
                   gm.players.add(plr);
                   usr.games.add(plr);
               });
           }
           if(Game.counter<=gm.id)
               Game.counter=gm.id+1;
        });
    }
    async notifyUserState(player){
        this.players.forEach(p=>{
            var resp=[{action:"updatePlayerState",player:player.user.id,isOnline:player.sock!=null}]
            if(p!=player && p.sock!=null)
                p.sock.send(resp);
        })
    }
    static findById(id){
        var g=Game.games.filter(g=>g.id==id)
        if(g.length()==1)
            return g.get(0)
        return null;
    }
    static async newGame(con){
        var gm=new Game(Game.counter++,new SetList(),null);
        var data=await GameData.loadGame(gm);
        gm.setGameData(data);
        await con.insert("untitled","Games",{id:gm.id,players:(new SetList()).toList(),avail:gm.avail});
        Game.games.add(gm);
        await Chat.newChat(gm, new SetList(), con, "Public")
        await gm.save(con)
        return gm;
    }
    async eliminatePlayer(con,player){
        player.alive=false;
        //TODO: update db on game and user
    }
    async addPlayer(con,user,name){
        var usrEx=false,plrEx=false;
        this.players.forEach(p=>{
            if(p.user===user)
            {
                usrEx=true;
                return;
            }
            if(p.name.toLowerCase()==name.toLowerCase()){
                plrEx=true;
                return;
            }
        })
        var ReservedNames=["test","public"]
        if (usrEx)
            return "You are already added to this game";
        if(this.AvailColors.length()===0||this.avail===0)
            return "Lobby Full";
        if(plrEx)
            return "Name Already Exists In Game";
        if((await Chat.getChatsForGame(this)).filter(c=>c.name.toLowerCase()==name.toLowerCase()).length()!=0)
            return "Name Already Exists In Game";
        if(ReservedNames.includes(name.toLowerCase()))
            return "Invalid Name";
        if(name.length>15)
            return "Name can't have more than 15 characters."
        var col=this.AvailColors.get(Math.floor(Math.random() * this.AvailColors.length()));
        this.AvailColors.delete(col);
        var player=new Player(user,this,name,col)
        this.players.add(player);
        user.games.add(player);
        this.avail--;
        await con.update("untitled","Games",{id:this.id},{players:(await this.getPlayerTags()).toList(),avail:this.avail})
        var chat=Chat.chats.filter(c=>c.name=="Public"&&c.game.id==this.id).get(0)
        var ch=Chat.chats.get(0)
        await chat.addParticipant(player,con);
        if(this.data!=null)
            this.data.assignCountries([player]);
        return player;
    }
    async getPlayerTags(getStatus=false){
        var tags=new SetList();
        await this.players.forEach(x=>{tags.add(x.getTag(getStatus))})
        return tags;
    }
}
class Player{
    constructor(user,game,name,color) {
        this.user=user;
        this.game=game;
        this.name=name;
        this.color=color;
        this.sock=null;
        this.alive=true;
    }
    getTag(includeStatus=false){
        var ret={user:this.user.id, name: this.name, color:this.color,game:this.game.id,alive:this.alive}
        if(includeStatus)
            ret.isOnline=!(this.sock==null);
        return ret;
    }
    async connected(sock){
        this.sock=sock;
        sock.player=this;
        sock.game=this.game;
        if(this.game.data==null) {
            console.log("loading game "+this.game.id)
            await this.game.load()
        }
        await this.game.notifyUserState(this);
        return true;
    }
    async disconnected(){
        this.sock=null;
        if((this.game.players.filter(p=>p.sock!=null)).length()==0) {
            this.game.save()
            console.log("game "+this.game.id+" saved to db");
        }
        await this.game.notifyUserState(this);
    }
}
module.exports = {User: User,Game,UserList,Chat,Message};