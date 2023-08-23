var tiles={}
function placeOnMap(tileId,obj){
    if(!Object.keys(tiles).includes(tileId))
        tiles[tileId]=new SetList();
    tiles[tileId].add(obj);
    if(obj.constructor.name=="Building"){
        img = document.createElement("img");
        img.classList.add("map-icons");
        img.setAttribute("src",document.location.host+"/static/img/"+obj.name+".png");

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