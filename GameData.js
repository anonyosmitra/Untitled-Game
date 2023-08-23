const SetList = require('./SetList.js')
const {Map} = require('./Map.js')
class GameData{
    static async load(){
        await Map.load()
    }
    async saveGame(con){
        var a=await con.find("untitled","Gamedata",{id:this.id});
        if(a.length==0)
            await con.insert("untitled","Gamedata",await this.makeMeta());
        else
            await con.update("untitled","Gamedata",{id:this.id},await this.makeMeta());
    }
    static async retrieveGame(con,ctrl){
        var a=await con.find("untitled","Gamedata",{id:ctrl.id});
        a=await GameData.loadGame(ctrl, a[0])
        return a;
    }
    static async loadGame(ctrl,meta=null){
        var map=null;
        var provinces={};
        var countries=new SetList();
        var pieces=new SetList();
        var plrs=new SetList();
        if(meta==null) {
            map=Map.maps["1"]//TODO: use random
            map.countries.forEach(c=>countries.add(new Country(c.id,new SetList(c.provinces))));
        }
        else{
            map=Map.maps[meta.mapId];
            meta.countries.forEach(c=>countries.add(Country.load(c,ctrl)));
            meta.provinces.forEach(p=>provinces[p.id]=Province.load(p,countries,map));
            var plrs=ctrl.players.filter(p=>p.alive)//alive players
            var occu=countries.filter(c=>c.player!=null);//assigned countries
            occu.forEach(c=>plrs.delete(c.player));//plrs=unassigned players
        }
        var gm= new GameData(ctrl.id,map,provinces,countries,ctrl,pieces);
        if(plrs.length()!=0)
            gm.assignCountries(plrs);
        return gm;
    }
    async assignCountries(players){
        var left=this.countries.filter((c=>c.player==null));//unassigned countries
        while(players.length()!=0){
            var pl=players.pickRandom(true);
            var cou=left.pickRandom(true);
            await this.activateCountry(cou, pl);
            console.log("Assigning player "+pl.user.name+" to Country "+cou.id);
        }
    }
    async makeMeta(){
        var prov=new SetList();
        Object.keys(this.provinces).forEach(p=>prov.add(this.provinces[p].toJSON()));
        var meta={countries:this.countries.map(c => c.toJSON()),id:this.id,mapId:this.map.id,provinces:prov.toList()};
        return meta;
    }
    async eliminate(country){
        if(country.provinces.size()==0 && this.pieces.filter(x=>x.country==country).length==0){
            await this.ctrl.eliminatePlayer(GameData.con,country.player);
            this.countries.delete(country)
            //update client map
        }
    }
    async takeProvince(proId,country){
        if(this.provinces.hasOwnProperty(proId)){//taken another player's province
            var loser=this.provinces[proId].country;
            this.provinces[proId].country=country;
            loser.provinces.delete(proId);
            country.provinces.add(proId);
            await this.eliminate(loser);
        }
        else{//taken independent province
            var pro=await this.activateProvince(proId,country);
            country.provinces.add(proId);
        }
        //update client map
    }
    async activateCountry(country,player){
        if(country.player===player)
            return country;
        else{
            country.player=player;
            country.provinces.forEach(x=>this.activateProvince(x,country));
        }
        //update client map
    }
    async activateProvince(id,country){
        if(!this.provinces.hasOwnProperty(id)){
            var map=this.map.provinces[id];
            //var pop=new Population(10,10,10,10,10)
            var buildings=new SetList();
            //TODOS: add building
            var pro=new Province(map,country,null,buildings);
            this.provinces[id]=pro;
            return pro;
        }
        //update client map
        return this.provinces[id];
    }
    getAvailable(){
        return (this.countries.filter(c=>c.player==null)).length()
    }
    constructor(id,map,provinces,countries,ctrl,pieces) {
        this.countries = countries;//SetList <Countries>
        this.id = id;
        this.map = map;
        this.provinces=provinces;//dict {id:Province} ONLY STORES OCCUPIED PROVINCES
        this.ctrl = ctrl;//gameId=ctrl.id
        this.pieces=pieces;
    }
}
class Population{
    constructor(total, birthRate, deathRate, education, moral) {
        this.count=total;
        this.birthRate=birthRate;
        this.deathRate=deathRate;
        this.education=education;
        this.moral=moral;
        //TODO: moral=military,economy,education, healthcare
    }
}
class Buildings{
    constructor(type) {
        this.type=type;
    }
}
class Depot extends Buildings{
    constructor(name) {
        super("Depot");
        this.name=name;
    }
    toJSON(){
        return {type:"Depot",name:this.name}
    }
    static load(meta){
        return new Depot(meta.name);
    }
}
class Province{
    constructor(prov,country,population,buildings) {
        this.country=country;
        this.map=prov;//Map.province
        //this.population=population;
        this.buildings=buildings;//SetList <Buildings>
    }
    toJSON(){
        return {id:this.map.id,country:this.country.id,buildings:this.buildings.map(x=>x.toJSON())}
    }
    static load(meta,countries,map){
        var country=countries.filter(c=>c.id==meta.country).get(0);
        var buildings=new SetList();
        meta.buildings.forEach(x=>{
            if(x.type=="Depot")
                buildings.add(Depot.load(x));
        });
        return new Province(map.provinces[meta.id],country,null,buildings);

    }

}
class Pieces{
    constructor(tileId,country) {
        this.tileId=tileId;
        this.country=country;
    }
}
class Country{
    constructor(id,provinces) {
        this.id=id;
        this.provinces=provinces;//[int]
        this.player=null;
    }
    toJSON(){
        var res= {id:this.id,provinces:this.provinces.toList(),player:null};
        if(this.player!=null)
            res.player=this.player.user.id;
        return res
    }
    static load(meta,ctrl){
        var c=new Country(meta.id,new SetList(meta.provinces))
        if(meta.player!=null)
            c.player=(ctrl.players.filter(p=>p.user.id==meta.player)).get(0);
        return c;
    }
}
module.exports = {GameData};