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