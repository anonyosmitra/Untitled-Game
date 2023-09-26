var socket;
var init=false;
var methods={};
var PreInitQueue=[]
function connectSocket(gid, user, s=true) {
    if(s)
        socket = new WebSocket("wss://fluidos.anonyo.net:8001");
    else
        socket = new WebSocket("ws://127.0.0.1:8001");
    socket.binaryType = "arraybuffer";
    socket.onopen = function() {
        var pay={action:"init",game:gid,player:user};
        socket.send(JSON.stringify(pay));
    }

    socket.onmessage = function(e) {
        //var enc = new TextDecoder("utf-8");
        //var arr = new Uint8Array(e.data);
        data=e.data;
        data=JSON.parse(data);
        console.log(data);
        if(data.constructor.name!="Array"){
            data=[data];
        }
        data.forEach(r=>{methods[r.action](r);})
    }

    socket.onclose = function(e) {
        console.log("socket closed!");
    }
    return socket;
}
function sendSockCommand(pay){
    socket.send(JSON.stringify(pay));
}
function initResp(data){
    if(init){
        console.log("Received unrequested init Response")
        return;
    }
    init=true;
    data.map.forEach(t=>{
        if(t[2]){
            setTileColor(t[0],"water")
            setAbbr(t[0],"Water")
            new Tile(t[0],null,true);
        }
        else if(t[1]!=null) {
            if (Province.provinces[t[1]] == undefined)
                new Province(t[1]);
            Province.provinces[t[1]].addTile(t[0])
            new Tile(t[0],Province.provinces[t[1]])
            if(t[3]!=null)
           new Building(t[0],t[3],Province.provinces[t[1]])
        }
    });
}
function loadChats(data){
    data.chats.forEach(c=>{
        c.participants=new SetList(c.participants);
        c.participants.remove(getUser());
        new Chat(c.id,c.data,c.name,c.participants);
        if(c.name!=null)
            Chat.makechatButton(c.participants,c.id,c.name);
    });
}
function updatePlayers(data){
    data.players.forEach(p=>new Player(p.user,p.name,p.color,p.isOnline));
}
function updateCountries(data){
    (data.countries.filter(c=>c.player!=null)).forEach(c=>{
        var cou=new Country(c.id,Player.getPlayer(c.player))
        c.provinces.forEach(p=>cou.addProvince(Province.provinces[p]));
    });
}
function updateProvinces(data){
    data.provinces.forEach(p=>{
        var prov=Province.provinces[p.id]
        prov.name=p.name;
        prov.population=p.population;
        prov.country=Country.find(p.country);
    })
}
function receiveMessage(data){
    data=data.data
    var chat=Chat.chats[data.chat]
    if(chat!=undefined){
        chat.messages.add(data);
        if(Chat.active==chat) {
            appendToChat(data);
            scrollChatToBottom()
        }
        else
            chat.incrementNotif(1);
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function timeInSec(){
    return Math.floor((new Date()).getTime() / 1000)
}
async function openChat(data){
    var n=0;
    while(n<4 && Chat.chats[data.chatId]==undefined){
        n++;
        await sleep(500);
    }
    Chat.loadChatBox(Chat.chats[data.chatId].eleId);
}
function updatePlayerState(data){//{player:pid,isOnline:True/False}
    Player.getPlayer(data.player).setState(data.isOnline);
}
function serverClosed(data){
    alert("Server is offline");
}
methods=Object.assign(methods, {"loadMap":initResp,"Closing Server":serverClosed,"updatePlayers":updatePlayers,"updateCountries":updateCountries,"loadChats":loadChats,"updatePlayerState":updatePlayerState,"receiveMsg":receiveMessage,"openChat":openChat,"updateProvinces":updateProvinces});