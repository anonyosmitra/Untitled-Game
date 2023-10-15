var tiles={}
var turnData={id:null,time:null,selfTurn:false};
var cache={}
class Tile{
    constructor(id,prov=null,water=false,contains=new SetList()) {
        this.id=id;
        this.prov=prov;
        if(prov!=null&&prov.constructor.name=="Number")
            this.prov=Province.provinces[prov];
        this.water=water;
        this.contains=contains;
        tiles[id]=this;
    }
    getBuilding(){
        var a=this.contains.filter(c=>c.constructor.name==="Building");
        if(a.length()>0)
            return a.get(0);
        else
            return null;
    }
    getPiece(){
        var a=this.contains.filter(c=>c.constructor.name==="Piece");
        if(a.length()>0)
            return a.get(0);
        else
            return null;
    }
    isWater(){
        return this.water;
    }
    isUnmarked(){
        return this.prov==null;
    }
    removePiece(obj){
        this.contains.remove(obj);
    }
    insertPiece(obj){
        this.contains.add(obj);
    }
    static placeUnmarked(){
        for(var i=1;i<=6440;i++){
            if(tiles[i]==undefined)
                new Tile(i);
        }
    }
}
function placeOnMap(tileId,obj){
    tiles[tileId].insertPiece(obj);
    if(obj.constructor.name=="Building"){
        img = document.createElement("img");
        img.classList.add("map-icons");
        img.setAttribute("src",document.location.protocol+"//"+document.location.host+"/static/img/"+obj.name+".png");
        document.getElementById("tile-"+tileId).innerHTML=img.outerHTML;
    }
    else{
        document.getElementById("tile-"+tileId).innerHTML+=makePiece(obj.id,obj.name,obj.country.player.color,obj.direction).outerHTML;
    }
    //TODO: Set Z axis
}
function setTileColor(tileIds,color){
    if(tileIds.constructor.name=="String"||tileIds.constructor.name=="Number")
        tileIds=[tileIds];
    tileIds.forEach(x=>document.getElementById("tile-"+x).classList="tile "+color);
}
function setAbbr(tileIds,text){
    if(tileIds.constructor.name=="String"||tileIds.constructor.name=="Number")
        tileIds=[tileIds];
    tileIds.forEach(x=>{
        var t=document.getElementById("abbr-"+x)
        t.title=text;
    });
}
function scrollChatToBottom(){
    var convo=document.getElementById("chat_convo");
    convo.scrollTop=convo.scrollHeight;
}
function skipTurn(){
    sendSockCommand({action:"skipTurn",turnId:turnData.id});
}
function appendToChat(msg){
    var convo=document.getElementById("chat_convo");
    var msgBox=document.createElement("div");
    msgBox.classList.add("messageBox");
    var bubble=document.createElement("p");
    bubble.classList.add("textbubble");
    var sender=Player.getPlayer(msg.sender)
    bubble.classList.add(sender.getColor());
    bubble.setAttribute("username",sender.name);
    if(sender.id==getUser())
        bubble.classList.add("sent");
    else
        bubble.classList.add("received");
    bubble.innerText=msg.msg;
    msgBox.appendChild(bubble);
    convo.appendChild(msgBox);
}
function updateTurnPan(data){
    document.getElementById("turnTracker-playerName").innerText=data.currentplayer.name;
    var butt=document.getElementById("turnTracker-skipButton");
    if(turnData.selfTurn){
        butt.disabled=false
    }
    else
        butt.disabled=true;
    document.getElementById("turnTracker-moves").innerText=data.movesLeft+"/"+data.moves;
}
function timerLoop(){
    if(turnData.time!=null) {
        sec=turnData.time-timeInSec()
        if(sec<=0)
            left="00:00"
        else{
            min=Math.floor(sec/60);
            sec=sec%60;
            if(sec<10)
                sec="0"+sec;
            left=min+":"+sec;
            if(left.length==4)
                left=0+left;
        }
        document.getElementById("turnTracker-time").innerText=left;
    }
    setTimeout(timerLoop,1000);
}
function loadLayout(){
    var tradePanel= document.createElement("Div");
    tradePanel.id="trade-pan"
    rightPanel=document.getElementById("pan-right")
    rightPanel.appendChild(tradePanel);
    var chatList=document.createElement("Div")
    chatList.id="ChatList-pan"
    rightPanel.appendChild(chatList);
    var playerList=document.createElement("Div")
    playerList.id="PlayerList-pan";
    chatList.appendChild(playerList);
    var GroupList=document.createElement("Div")
    GroupList.id="GroupList-pan";
    chatList.appendChild(GroupList);
    var chatBox=document.createElement("Div")
    chatBox.id="chatBox-Pan"
    rightPanel.appendChild(chatBox);
    var exitButt=document.createElement("button")
    exitButt.innerText="Exit Game";
    exitButt.addEventListener("click",function (){window.location.href="/"});
    var leftPanel=document.getElementById("pan-left")
    leftPanel.appendChild(exitButt);
    var turnTracker=document.createElement("Div");
    turnTracker.id="TurnTracker-Pan";
    turnTracker.innerHTML='<snap id="turnTracker-playerName"></snap> <snap id="turnTracker-time">3:00</snap> <button onclick="skipTurn()" id="turnTracker-skipButton">Skip</button><br>Moves Left: <snap id="turnTracker-moves">0/0</snap>';
    leftPanel.appendChild(turnTracker);
    var assetPan=document.createElement("Div");
    assetPan.id="assetInfo-Pan";
    leftPanel.appendChild(assetPan);
    setTimeout(timerLoop,1000)
}
function showProvincePanel(prov){
    var pan=document.getElementById("assetInfo-Pan")
    pan.innerHTML="";
    var tit=null;
    if(prov.country.player.id==getUser()){
        tit=document.createElement("Input")
        tit.id="provName"
        tit.value=prov.name;
        tit.addEventListener("focusout", () => {cache.assetPresented.rename(document.getElementById("provName").value)});

    }
    else{
        tit=document.createElement("p")
        tit.innerText=prov.name;
    }
    pan.appendChild(tit);
    cache.assetPresented=prov
}
function clc(tile){
    console.log(tile.id);
    showProvincePanel(tiles[parseInt(tile.id.split("-")[1])].prov)
}