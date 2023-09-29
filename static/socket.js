var socket;
var init=false;
var playerInit=false;
var countryInit=false;
var methods={};
var PreInitQueue=[]
var PlayerInitQueue=[];
var CountryInitQueue=[];
//turnId: 6, currentPlayer: 1, moves: 12, movesLeft: 12, endTime: 1695769477}
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
        data.forEach(r=>{
            console.log(r);
            if(!init && r.action!="loadMap") {
                console.log("queuing")
                PreInitQueue.push(r)
            }
            else{
                console.log("running")
                methods[r.action](r);}
        })
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
    init=true;
    PreInitQueue.forEach(r=> {
        methods[r.action](r);
    });
    PreInitQueue=[];
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
    if(!playerInit) {
        playerInit = true;
        PlayerInitQueue.forEach(r=> {
            methods[r.action](r);
        });
        PlayerInitQueue=[];
    }
}
function updateCountries(data){//Req:Players,Provinces
    console.log("Updating Countries")
    (data.countries.filter(c=>c.player!=null)).forEach(c=>{
        var cou=new Country(c.id,Player.getPlayer(c.player))
        c.provinces.forEach(p=>cou.addProvince(Province.provinces[p]));
    });
    if(!countryInit){
        countryInit=true;
        CountryInitQueue.forEach(r=> {
            methods[r.action](r);
        });
        CountryInitQueue=[];
    }
}
function updateProvinces(data){//req: players
    console.log(Player.player)
    if(!playerInit){
        PlayerInitQueue.push(data)
        return null;}
    data.provinces.forEach(p=>{
        var prov=Province.provinces[p.id]
        var keys=Object.keys(p)
        if(keys.includes("name"))
            prov.name=p.name;
        if(keys.includes("population"))
            prov.population=p.population;
        if(keys.includes("country") && countryInit) {
            if(p.country==null && prov.country!=null)
                prov.country.removeProvince(prov);
            else
                Country.find(p.country).add(prov);
        }
        if(keys.includes("resources")){
            p.resources.forEach(async r=>{
                await prov.resources.deleteWhere(rs=>rs.name==r.name);
                prov.resources.add(new Resources(r));
            })
        }
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
function updateTurn(data){
    if(!playerInit){
        PlayerInitQueue.push(data)
        return null;}
    console.log("Running update Turn")
    data.currentplayer=Player.getPlayer(data.currentPlayer);
    console.log(data.currentplayer)
    turnData={time:data.endTime,id:data.turnId,selfTurn: data.currentplayer==Player.player};
    updateTurnPan(data);
}
methods=Object.assign(methods, {"UpdateTurn":updateTurn,"loadMap":initResp,"Closing Server":serverClosed,"updatePlayers":updatePlayers,"updateCountries":updateCountries,"loadChats":loadChats,"updatePlayerState":updatePlayerState,"receiveMsg":receiveMessage,"openChat":openChat,"updateProvinces":updateProvinces});