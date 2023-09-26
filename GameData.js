const SetList = require('./SetList.js')
const {Map} = require('./Map.js')
const resources= {
    Wood:{name:"Wood",prob:7},
    Coal:{name:"Wood",prob:6},
    Agriculture:{name:"Agriculture",prob:8},
    Solar:{name:"Solar",prob:9},
    Iron:{name:"Iron",prob:5},
    Lithium:{name:"Lithium",prob:4},
    Uranium:{name:"Uranium",prob:2},
    Oil:{name:"Oil",prob:4}
    }
function dice(max=10,min=0) {
    return Math.floor(Math.random() * (max - min)) + min;
}

class GameData {
    static async load() {
        await Map.load()
    }
    findCountryByPlayer(player){
        var cou=this.countries.filter(c=>c.player==player)
        if(cou.length()==0)
            return null;
        return cou.get(0);
    }

    async getCountries() {
        var cous = []
        await this.countries.forEach(c => cous.push(c.toJSON()));
        return cous;
    }

    async getAllProvinces(player){
        var provs=[]
        var country=this.findCountryByPlayer(player);
        console.log("Country: "+country.id)
        await Object.values(this.provinces).forEach(p=>provs.push(p.toJSON(country)));
        return provs;
    }

    async saveGame(con) {
        var a = await con.find("untitled", "Gamedata", {id: this.id});
        if (a.length == 0)
            await con.insert("untitled", "Gamedata", await this.makeMeta());
        else
            await con.update("untitled", "Gamedata", {id: this.id}, await this.makeMeta());
    }

    static async retrieveGame(con, ctrl) {
        var a = await con.find("untitled", "Gamedata", {id: ctrl.id});
        a = await GameData.loadGame(ctrl, a[0])
        return a;
    }

    static async loadGame(ctrl, meta = null) {
        var map = null;
        var provinces = {};
        var countries = new SetList();
        var pieces = new SetList();
        var plrs = new SetList();
        var chats=new SetList();
        var messages=new SetList()
        if (meta == null) {
            map = Map.maps["1"]//TODO: use random
            map.countries.forEach(c => countries.add(new Country(c.id, new SetList(c.provinces))));
        } else {
            map = Map.maps[meta.mapId];
            meta.countries.forEach(c => countries.add(Country.load(c, ctrl)));
            meta.provinces.forEach(p => provinces[p.id] = Province.load(p, countries, map));
            var plrs = ctrl.players.filter(p => p.alive)//alive players
            var occu = countries.filter(c => c.player != null);//assigned countries
            occu.forEach(c => plrs.delete(c.player));//plrs=unassigned players

        }
        var gm = new GameData(ctrl.id, map, provinces, countries, ctrl, pieces);
        if (plrs.length() != 0)
            gm.assignCountries(plrs);
        return gm;
    }

    async assignCountries(players) {
        var left = this.countries.filter((c => c.player == null));//unassigned countries
        if(players.constructor.name=="Array"){
            players=new SetList(players)
        }
        var payloadPlayers=new SetList();
        var payloadCountries=new SetList();
        while (players.length() != 0) {
            var pl = players.pickRandom(true);
            var cou = left.pickRandom(true);
            await this.activateCountry(cou, pl);
            cou.money=100000;
            console.log("Assigning player " + pl.user.name + " to Country " + cou.id);
            payloadPlayers.add(pl.getTag(true));
            payloadCountries.add(cou.toJSON());
        }
        if(payloadPlayers.length()>0){
            var pay=[{action:"updatePlayers",players:payloadPlayers.toList()},{action: "updateCountries",countries:payloadCountries.toList()}]
            this.ctrl.players.forEach(p=>{
                if(p.sock!=null)
                    p.sock.send(pay);
            })
        }
    }

    async makeMeta() {
        var prov = new SetList();
        Object.keys(this.provinces).forEach(p => prov.add(this.provinces[p].toJSON()));
        var meta = {
            countries: this.countries.map(c => c.toJSON()),
            id: this.id,
            mapId: this.map.id,
            provinces: prov.toList()
        };
        return meta;
    }

    async eliminate(country) {
        if (country.provinces.size() == 0 && this.pieces.filter(x => x.country == country).length == 0) {
            await this.ctrl.eliminatePlayer(GameData.con, country.player);
            this.countries.delete(country)
            //update client map
        }
    }

    async takeProvince(proId, country) {
        if (this.provinces.hasOwnProperty(proId)) {//taken another player's province
            var loser = this.provinces[proId].country;
            this.provinces[proId].country = country;
            loser.provinces.delete(proId);
            country.provinces.add(proId);
            await this.eliminate(loser);
        } else {//taken independent province
            var pro = await this.activateProvince(proId, country);
            country.provinces.add(proId);
        }
        //update client map
    }

    async activateCountry(country, player) {
        if (country.player === player)
            return country;
        else {
            country.player = player;
            country.provinces.forEach(x => this.activateProvince(x, country));
        }
        //update client map
    }

    async activateProvince(id, country) {
        if (!this.provinces.hasOwnProperty(id)) {
            var map = this.map.provinces[id];
            //var pop=new Population(10,10,10,10,10)
            var buildings = new SetList();
            //TODOS: add building
            var pro = new Province(map, country,"Province "+id, null, buildings);
            this.provinces[id] = pro;
            //TODO: add random resources
            return pro;
        }
        //update client map
        return this.provinces[id];
    }

    getAvailable() {
        return (this.countries.filter(c => c.player == null)).length()
    }

    constructor(id, map, provinces, countries, ctrl, pieces) {
        this.countries = countries;//SetList <Countries>
        this.id = id;
        this.map = map;
        this.provinces = provinces;//dict {id:Province} ONLY STORES OCCUPIED PROVINCES
        this.ctrl = ctrl;//gameId=ctrl.id
        this.pieces = pieces;
    }
}

class BluePrint{

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
    toJSON(){
        return {count:this.count,birthRate:this.birthRate,deathRate:this.deathRate,education:this.education,moral:this.moral};
    }
}
class Resources{
    constructor(name,available,renewalRate,discovered=false){
        this.name=name;
        this.available=available;
        this.renewalRate=renewalRate;
        this.discovered=discovered;
    }
    toJSON(){
        return {name:this.name,available:this.available,renewalRate:this.renewalRate,discovered:this.discovered};
    }
}
class Buildings{
    constructor(type) {
        this.type=type;
    }
}
class Inventory{
    constructor() {
        this.food=food;//Int
        this.oil=oil;//int
        this.energy=energy;//int
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
class Institution extends Buildings{
    constructor(name) {
        super("Institution");
        this.name=name;
        this.level=0;
    }
    toJSON(){
        return {type:"Institution",name:this.name,level:this.level};
    }
    static load(meta){
        var a= new Institution(meta.name);
        if(Object.keys(meta).includes("level") && meta.level!=null)
            a.level=meta.level;
        return a;
    }
}
class Industry extends Buildings{
    constructor(name) {
        super("Industry");
        this.name=name;
        this.level=0;
    }
    toJSON(){
        return {type:"Industry",name:this.name,level:this.level}
    }
    static load(meta){
        var a= new Industry(meta.name);
        if(Object.keys(meta).includes("level") && meta.level!=null)
            a.level=meta.level;
        return a;
    }
}
class Province{
    constructor(prov,country,name,population,depot,industry,institution,queue,resources,inventory) {
        this.country=country;
        this.map=prov;//Map.province
        this.name=name;
        this.industry=industry;
        this.institution=institution;
        this.queue=queue;//SetList <Tasks>
        this.population=population;
        this.depot=depot;//SetList <depot>
        this.resources=resources;
        this.inventory=inventory;
    }
    toJSON(country=null){
        if(country==null||country==this.country){
            var buildings=[]
            console.log(this.industry.constructor.name)
            if(this.industry!=null)
                this.industry.forEach(x=>buildings.push(x.toJSON()));
            this.depot.forEach(x=>buildings.push(x.toJSON()));
            this.institution.forEach(x=>buildings.push(x.toJson()));
            return {id:this.map.id,name:this.name,country:this.country.id,buildings:this.buildings,population:this.population.toJSON()}}
        return {id:this.map.id,name:this.name,country:this.country.id}
    }

    static load(meta,countries,map){
        var country=countries.filter(c=>c.id==meta.country).get(0);
        var buildings=new SetList();
        var institution=new SetList();
        var industry=new SetList();
        meta.buildings.forEach(x=>{
            if(x.type=="Depot")
                buildings.add(Depot.load(x));
            else if(x.type=="Institution")
                institution.add(Institution.load(x));
            else if(x.type=="Industry")
                industry.add(Industry.load(x));
        });
        return new Province(map.provinces[meta.id],country,meta.name,null,buildings,industry,institution);

    }
    async setName(gamedata,name){
        var nameExists=false;
        Object.keys(gamedata.provinces).forEach(pid=>{if(gamedata.provinces[pid].name==name) nameExists=true;});
        if(nameExists)
            return false;
        this.name=name;
        return true;

    }

}
class Pieces{
    constructor(tileId,country) {
        this.tileId=tileId;
        this.country=country;
    }
}
class Country{
    constructor(id,provinces,money=null) {
        this.id=id;
        this.provinces=provinces;//[int]
        this.player=null;
        this.money=null;
    }
    toJSON(){
        var res= {id:this.id,provinces:this.provinces.toList(),player:null,money:this.money};
        if(this.player!=null)
            res.player=this.player.user.id;
        return res
    }
    static load(meta,ctrl){
        var c=new Country(meta.id,new SetList(meta.provinces),meta.money)
        if(meta.player!=null)
            c.player=(ctrl.players.filter(p=>p.user.id==meta.player)).get(0);
        return c;
    }
}
module.exports = {GameData};