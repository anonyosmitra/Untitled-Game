class Player{
    static players={}
    constructor(id,name,color,isOnline) {
        this.id=id;
        this.name=name;
        this.color=color;
        this.country=null;
        this.chat=null;
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
 static chats={};
 static active=null;
    constructor(id,msgs,name,players){
     this.id=id;
     this.name=name;
     this.participants=new SetList(players);
     if(this.participants.length()==1)
         Player.players[this.participants.get(0)].chat=this;
     this.messages=new SetList(msgs);
     Chat.chats[this.id]=this;
     this.makechatButton();
    }
    incrementNotif(v=1) {
        var note = document.getElementById("chatNotif-" + this.id)
        if (v == 0)
            note.innerText = "";
        else if (note.innerText != "9+") {
            v = parseInt(note.innerText) + v;
            if(v>9)
                v="9+"
            note.innerText=v;
        }
    }
    makechatButton(){
        var pan=document.getElementById("playerList-pan")
        var a=document.getElementById("chatButt-"+this.id);
        if(a!=undefined)
            a.remove();
        a=document.getElementById("chatNotif-"+this.id);
        if(a!=undefined)
            a.remove();
        var butt=document.createElement("Div")
        butt.id="chatButt-"+this.id;
        butt.classList.add("chatListItem");
        if(this.participants.length()==1 && this.participants.get(0).isOnline)
            butt.classList.add(this.participants.get(0).color);
        var count=document.createElement("Snap")
        count.id="chatNotif-"+this.id;
        count.innerText="";
        count.classList.add("chatNotification");
        butt.addEventListener("click",function () {
            console.log("open chat "+this.id);
        });
        var nm=document.createElement("snap")
        nm.innerText=this.name;
        butt.appendChild(nm);
        butt.appendChild(count);
        pan.appendChild(butt);
    }
}