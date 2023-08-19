const SetList = require('./SetList.js')
const fs = require("fs");
class Map{
    static mapIds=["1"];
    static maps={}
    static grid={};
    constructor(id,tiles,provinces,countries) {
        this.id=id;
        this.tiles=tiles;//dict {id:<Tile>}
        this.provinces=provinces;//dict {id:<Province>}
        this.countries=countries;//setList<Countries>
        Map.maps[this.id]=this;
    }
    static async loadFile(name){
        fs.readFile("Maps/"+name+".map", 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }
            data=JSON.parse(data);
            var provinces={}
            var countries=new SetList();
            var tiles={};
            data.waterTiles.forEach(x=> tiles[x]=new Tile(x,null,true));
            for(var i in data.provinces){
                var Pvtiles=new SetList();
                var depots=new SetList();
                var id=data.provinces[i].id;
                var dep=null;
                data.provinces[i].tiles.forEach(x=>{
                    if(x.constructor.name=="Number") {
                        Pvtiles.add(x)
                        x = {tile: x};
                        dep=null;
                    }
                    else {
                        depot.resources.forEach(r=>{
                           if(r==x.name) {
                               depots.add(new Depot(x.tile, r));
                               dep=r;
                           }
                        });
                    }
                    var pro=new Province(id,Pvtiles,depots);
                    provinces[id] =pro;
                    tiles[x.tile]=new Tile(x.tile,pro,false)
                    if(dep!=null)
                        tiles[x.tile].contains=dep;
                });
            }
            data.countries.forEach(x=>{
                countries.add(new Country(x.id,x.provinces))
            });
            Map.maps[name]=new Map(name,tiles,provinces,countries);
        });
    }
    static async loadGrid(){
        fs.readFile("Maps/neighbour.data", 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }
            Map.grid = JSON.parse(data);
        });
    }
    static async load(){
        await Map.mapIds.forEach(m=>Map.loadFile(m))
        await Map.loadGrid();
    }
}
class Direction{
    static E="East";
    static W="West";
    static NE="North East";
    static NW="North West";;
    static SE="South East";;
    static SW="South West";;
}
class Tile{
    constructor(id,province,isWater,mapId,contains=null) {
        this.id=id;
        this.province=province;
        this.isWater=isWater;
        this.contains=contains
    }
    static getNeighbour(tile,direction){
        if(tile.constructor.name=="Tile")
            tile=tile.id;
        return Map.grid[tile][direction];
    }
}
class Province{
    constructor(id,tiles,depots) {
        this.id=id;
        this.tiles=tiles;
        this.depots=depots;
    }
}
class depot {
    static CITY = "city";
    static PORT="port";
    static AIRPORT="airport";
    static resources=[depot.CITY,depot.PORT,depot.AIRPORT]
}
class Depot{
    constructor(tile,name) {
        this.tile=tile;
        this.name=name;
    }
}
class Country{
    constructor(id,provinces) {
        this.id=id;
        this.provinces=provinces;
    }
}
//Map.load()
module.exports={Map}
//setTimeout(x=>console.log(Map.maps["1"]["provinces"][15]),2000)

