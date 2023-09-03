class Player{
    static players={}
    constructor(id,name,color,isOnline) {
        this.id=id;
        this.name=name;
        this.color=color;
        this.country=null;
        this.isOnline=isOnline;
        Player.players[this.id]=this;
    }
    getColor(){
        if(this.isOnline)
            return this.color
        return "white"
    }
}
function getUser(){
    user=parseInt(getCookie("untitled_uid"))
    return user;
}
class Country{
    constructor(id,player){
        this.id=id;
        this.player=player;
        this.provinces=new SetList();
    }
    addProvince(prov){
        this.provinces.add(prov)
        prov.country=this;
        setTileColor(prov.tiles,this.player.getColor());
        setAbbr(prov.tiles,'Country: '+this.player.name+'\nProvince: '+prov.id);
    }
}
class Province{
    static provinces={}
    constructor(id) {
        this.id=id;
        this.tiles=new SetList();
        this.buildings=new SetList();
        this.country=null;
        Province.provinces[id]=this;
    }
    addTile(tileId){
        this.tiles.add(tileId);
        setAbbr(tileId,'Province: '+this.id);
    }
}
class Building{
    constructor(tileId,type,prov){//adds building to province
        this.tileId=tileId;
        this.province=prov;
        this.name=type;
        prov.buildings.add(this);
        placeOnMap(tileId,this);
    }
}
class Piece{
    static pieces={}
    constructor(id,player,name,tileId=null,direction="left") {
        this.id=id;
        this.player=player;
        this.name=name;
        this.tileId=tileId;
        this.direction=direction;
        Piece.pieces[this.id]=this;
        placeOnMap(tileId,this);
    }
}
class Chat{
    static chatCounter=1;
    static chats={}
    static chatsByPlayer={}
    static chatsByName={}
    static displayed=null;
    static makeChat(data){
        var partis=new SetList()
        var user=getUser()
        data.participants.forEach(pid=>{
            if(pid!=user)
                partis.add(Player.players[pid]);
        });
        var chatObj=null
        if(data.hasOwnProperty("name")) {
            chatObj=new Chat(Chat.chatCounter++, partis, data.data, data.name)
            Chat.chatsByName[data.name]=chatObj;
        }
        else{
            chatObj=new Chat(Chat.chatCounter++, partis, data.data)
            Chat.chatsByPlayer[partis[0].id]=chatObj;
        }
        return chatObj.id;
    }
    static loadChat(id){

    }
    constructor(id,participants,data,name=null) {//data=[{user:1,message:hello,time:timestamp}]
        this.id=id;
        this.partcipants=participants;
        this.data=data;
        this.name=name
    }
}