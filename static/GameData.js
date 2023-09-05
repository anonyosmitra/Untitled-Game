class Player{
    static players={}
    static player=null
    constructor(id,name,color,isOnline) {
        this.id=id;
        this.name=name;
        this.color=color;
        this.country=null;
        this.chat=null;
        this.isOnline=isOnline;
        if(this.id==getUser())
            Player.player=this;
        else {
            Player.players[this.id] = this;
            Chat.makechatButton([this.id])
        }
    }
    getColor(force=false){
        if(this.isOnline || force)
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
        console.log(player);
        player.country=this;
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
     if(msgs.constructor.name=="Array")
        this.messages=new SetList(msgs);
     Chat.chats[this.id]=this;
     Chat.makechatButton();
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
    static requestChatroom(playerIds,name=null){
        //TODO: send request for a chatroom with player(s)
    }
    static makechatButton(participants,chatId=null,name=null) {
        if (participants.constructor.name != "SetList")
            participants = new SetList([participants]);
        var pan = document.getElementById("GroupList-pan")
        var eleId="";//Private: P<pid>, Group: C<chatId>
        participants.remove(getUser());
        if(name==null){//Private chat
            pan = document.getElementById("PlayerList-pan")
            participants=participants.get(0);
            eleId="P"+participants;
            if(chatId!=null)
                Player.players[participants].chat=Chat.chats[chatId];
            name=Player.players[participants].name;
            console.log(name)
        }
        else
            eleId="C"+chatId;
        var a = document.getElementById("chatButt-" + eleId);
        if (a != undefined)
            a.remove();
        a = document.getElementById("chatNotif-" + eleId);
        if (a != undefined)
            a.remove();
        var butt = document.createElement("Div")
        butt.id = "chatButt-" + eleId;
        butt.classList.add("chatListItem");
        var count=document.createElement("Snap")
        count.id="chatNotif-"+eleId;
        count.innerText="";
        count.classList.add("chatNotification");
        if (eleId[0]=="P"){//Private chat
            butt.classList.add(Player.players[participants].getColor());
        }
        butt.addEventListener("click",function () {
            console.log("open chat "+eleId);
        });
        var nm=document.createElement("snap")
        nm.innerText=name;
        butt.appendChild(nm);
        butt.appendChild(count);
        pan.appendChild(butt);
    }
}