var tiles={}
function placeOnMap(tileId,obj){
    if(!Object.keys(tiles).includes(tileId))
        tiles[tileId]=new SetList();
    tiles[tileId].add(obj);
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
function loadLayout(){
    var tradePanel= document.createElement("Div");
    tradePanel.id="trade-pan"
    rightPanel=document.getElementById("pan-right")
    rightPanel.appendChild(tradePanel);
    var chatList=document.createElement("Div")
    chatList.id="ChatList-pan"
    rightPanel.appendChild(chatList);
    var playerList=document.createElement("Div")
    playerList.id="PlayerList=pan";
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
}
function clc(tile){
    console.log(tile.id);
}