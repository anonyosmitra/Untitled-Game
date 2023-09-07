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

    static getPlayer(pid) {
        if(pid==getUser())
            return Player.player;
        else
            return Player.players[pid];
    }
    setState(isOnline){
        this.isOnline=isOnline;
        this.country.setColor(this.getColor());
        var chatButt=document.getElementById("chatButt-P"+this.id);
        if(chatButt!=undefined){
            chatButt.classList.remove("white");
            chatButt.classList.add(this.getColor());
        }
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
        player.country=this;
    }
    addProvince(prov){
        this.provinces.add(prov)
        prov.country=this;
        setTileColor(prov.tiles,this.player.getColor());
        setAbbr(prov.tiles,'Country: '+this.player.name+'\nProvince: '+prov.id);
    }
    setColor(color){
        this.provinces.forEach(p=>p.setColor(color));
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
    setColor(color){
        setTileColor(this.tiles,color);
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
class Alliance{
    constructor(id,name,participants,rules=[]) {

    }
}
class Chat{
 static chats={};
 static active=null;
    constructor(id,msgs,name,players){
     this.id=id;
     this.name=name;
     this.participants=new SetList(players);
     this.eleId="C"+this.id;
     if(this.name==null) {
         Player.players[this.participants.get(0)].chat = this;
         this.eleId="P"+this.participants.get(0);
     }
     if(msgs.constructor.name=="Array")
        this.messages=new SetList(msgs);
     Chat.chats[this.id]=this;
    }
    send(text){
        var pay={action:"sendMsg",chatId:this.id,message:text};
        sendSockCommand(pay);
    }
    incrementNotif(v=1) {
        var note = document.getElementById("chatNotif-" + this.eleId)
        if (v == 0)
            note.innerText = "";
        else if(note.innerText == "") {
            note.innerText = v;
        }
        else if (note.innerText != "9+") {
            v = parseInt(note.innerText) + v;
            if(v>9)
                v="9+"
            note.innerText=v;
        }
    }
    static requestChatroom(playerIds,name=null){
        var pay={action:"newChat",players:playerIds,name:null};
        sendSockCommand(pay);
    }
    static loadChatBox(eleId){
        var title=null;
        var part=null;
        var chat=null;
        var player=null;
        if(eleId[0]=="P"){
            var pid=parseInt(eleId.slice(1))
            if(Player.players[pid].chat==null)
                Chat.requestChatroom([pid])
            else{
                player=Player.players[pid]
                title=Player.players[pid].name;
                chat=Player.players[pid].chat;
            }
        }
        else {
            var cid=parseInt(eleId.slice(1))
            chat=Chat.chats[cid];
            title=chat.name;
            part=chat.participants;
        }
        if(chat!=null){
            var pan=document.getElementById("chatBox-Pan")
            pan.innerHTML="";
            var header=document.createElement("div")
            header.classList.add("chat-header")
            if(player!=null){
                header.classList.add(player.getColor(true));
            }
            var head_title=document.createElement("snap")
            head_title.innerText=title;
            header.appendChild(head_title);
            //TODO: if group, add info icon
            pan.appendChild(header);
            var convo=document.createElement("div")
            convo.id="chat_convo";
            convo.classList.add("chat_convo")
            pan.appendChild(convo);
            var inp=document.createElement("input")
            inp.classList.add("chatInput");
            inp.placeholder="Send a message"
            inp.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    chat.send(this.value);
                    this.value="";
                }
            });
            pan.appendChild(inp);
            var msgs=chat.messages.sort((a,b)=>a.time<b.time);
            msgs.forEach(m=>appendToChat(m));
            scrollChatToBottom();
            Chat.active=chat;
            chat.incrementNotif(0);
        }
    }
    static makechatButton(participants,chatId=null,name=null) {
        if (participants.constructor.name != "SetList")
            participants = new SetList([participants]);
        var pan = document.getElementById("GroupList-pan")
        var eleId="";//Private: P<pid>, Group: C<chatId>
        if(chatId!=null)
            eleId=Chat.chats[chatId].eleId;
        else
            eleId="P"+participants.get(0);
        participants.remove(getUser());
        if(name==null){//Private chat
            pan = document.getElementById("PlayerList-pan")
            participants=participants.get(0);
            name=Player.players[participants].name;
        }
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
            Chat.loadChatBox(eleId);
        });
        var nm=document.createElement("snap")
        nm.innerText=name;
        butt.appendChild(nm);
        butt.appendChild(count);
        pan.appendChild(butt);
    }
}