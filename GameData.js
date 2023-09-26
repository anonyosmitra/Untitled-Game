const SetList = require('./SetList.js')
const {Map} = require('./Map.js')
const resources= [
    {name:"Wood",prob:7,minProd:5000,maxProd:10000},
    {name:"Coal",prob:6,minProd:2000,maxProd:5000},
    {name:"Food",prob:8,minProd:2000000,maxProd:4000000},
    {name:"Solar",prob:9,minProd:20000,maxProd:50000},
    {name:"Iron",prob:5,minProd:1000,maxProd:3000},
    {name:"Sand",prob:7,minProd:1000,maxProd:3000},
    {name:"Lithium",prob:4,minProd:500,maxProd:2000},
    {name:"Uranium",prob:2,minProd:100,maxProd:300},
    {name:"Oil",prob:4,minProd:5000,maxProd:10000}
    ]
function dice(max=10,min=0) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function diceBool(max=10,min=0){
    return dice(max,min)<=min;
}
class TurnTracker{
    constructor(data,player=null,turnId=0) {//gamedata,currentPlayer
        this.game=data;
        this.currentPlayer=player;
        this.turnId=turnId;
        this.moves=0;
        this.movesLeft=0;
        this.endTime=null;
        this.active=false;
    }
    getCurrentTurn(){
        var payload= {turnId:this.turnId,currentPlayer:null,moves:this.moves,movesLeft:this.movesLeft,endTime:this.endTime}
        if(this.currentPlayer!=null)
            payload.currentPlayer=this.currentPlayer.user.id;
        return payload
    }
    stop(){
        this.active=false;
        var payload= {currentPlayer:null,turnId:this.turnId}
        if(this.currentPlayer!=null)
            payload.currentPlayer=this.currentPlayer.user.id;
        return payload
    }
    async start() {
        this.active = true;
        await this.nextPlayer();
    }
    static async load(data,meta=null){
        var plr=null
        var turnId=0
        var tt=null;
        if(meta!=null){
            plr=meta.currentPlayer;
            turnId=meta.turnId;
        }
        tt=new TurnTracker(data,plr,turnId);
        await tt.start();
        return tt;
    }
    async nextPlayer(){
        if(!this.active)
            return null;
        var pls=this.game.ctrl.players.filter(p => p.alive && p.sock != null)
        if(pls.length()==0)
            return null;
        if(this.currentPlayer==null)
            this.currentPlayer=pls.get(0);
        else{
            var pls=this.currentPlayer = this.game.ctrl.players;
            var nextPlayer=null
            var i=pls.findIndex(this.currentPlayer)+1,j=0;
            if(i==pls.length())
                i=0;
            while(nextPlayer==null && j<pls.length()){
                var p=pls.get(i);
                if(p.alive && p.sock!=null)
                    this.currentPlayer=p;
                else
                {
                    i++;
                    j++;
                    if(i==pls.length())
                        i=0;
                }
            }
            if(nextPlayer==null)
                return null
            this.currentPlayer=nextPlayer;
        }
        console.log("Turn: "+this.currentPlayer.name);
        var cou=this.game.countries.filter(c=>c.player==this.currentPlayer).get(0)
        var moves=cou.getMovesPermitted();
        this.moves=moves;
        this.movesLeft=moves;
        console.log("Moves: "+this.moves);
        this.turnId++;
        var time=moves*30;
        console.log("Time: "+time);
        this.endTime=Math.floor((new Date()).getTime() / 1000)+time;
        setTimeout(TurnTracker.turnTimeout,time,this.game.id,this.turnId)
        //Todo: Update players;
    }
    static turnTimeout(gameId,turnId){
        var gm=GameData[gameId]
        if(gm==undefined)
            return null;
        if(gm.turnTracker.turnId!=turnId)
            return null;
        gm.turnTracker.nextPlayer();
    }
}
class GameData {
    static dataList={}
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
        await Object.values(this.provinces).forEach(p=>provs.push(p.toJSON(country)));
        return provs;
    }

    async saveGame(con) {
        var a = await con.find("untitled", "Gamedata", {id: this.id});
        if (a.length == 0)
            await con.insert("untitled", "Gamedata", await this.makeMeta());
        else
            await con.update("untitled", "Gamedata", {id: this.id}, await this.makeMeta());
        delete GameData.dataList[this.id];
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
            await gm.assignCountries(plrs);
        if(meta==null || meta.turnTracker==undefined)
            gm.turnTracker=await TurnTracker.load(gm)
        else
            gm.turnTracker=await TurnTracker.load(gm,meta.turnTracker);
        GameData.dataList[gm.id]=gm;
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
            provinces: prov.toList(),
        };
        if(this.turnTracker!=null)
            meta.turnTracker=this.turnTracker.stop();
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
            console.log("Activating Province "+id)
            var map = this.map.provinces[id];
            var pop=Population.newPopulation();
            var buildings = new SetList();
            //TODO: add building
            var resourcePool=Resources.createResourcePool();
            var pro = Province.load({id:id,name:"Province "+id,country:country.id,population:(Population.newPopulation()).toJSON(),resources:resourcePool},this.countries,this.map)
            this.provinces[id] = pro;
            return pro;
        }
        else{
            console.log("Province already active");
        }
        //update client map
        return this.provinces[id];
    }

    getAvailable() {
        return (this.countries.filter(c => c.player == null)).length()
    }

    constructor(id, map, provinces, countries, ctrl, pieces,turnTracker=null) {
        this.countries = countries;//SetList <Countries>
        this.id = id;
        this.map = map;
        this.provinces = provinces;//dict {id:Province} ONLY STORES OCCUPIED PROVINCES
        this.ctrl = ctrl;//gameId=ctrl.id
        this.pieces = pieces;
        this.turnTracker=turnTracker;
    }
}

class BluePrint{

}

class Population{
    constructor(total, birthRate, deathRate, education, moral) {
        this.count=total;
        this.birthRate=birthRate;//population increases by this %
        this.deathRate=deathRate;//population decreases by this %
        this.education=education;//% of population that is educated
        this.moral=moral;//%
        //TODO: moral=military,economy,education, healthcare
    }
    static newPopulation(){
        return new Population(dice(100000,200000),dice(40,50),dice(40,50),dice(30,50),dice(50,60));
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
    static createResourcePool(){
        var pool=[]
        resources.forEach(r=>{
            if(diceBool(10,r.prob)){
                var rr=dice(r.maxProd,r.minProd)
                pool.push({name:r.name,available:rr*10,renewalRate:rr,discovered:false})
            }
        });
        return pool;
    }
    static loadPool(lst){
        var pool=new SetList();
        lst.forEach(r=>pool.add(new Resources(r.name,r.available,r.renewalRate,r.disabled)));
        return pool;
    }
    static toJSON(lst,showAll=false){
        var pool=[]
        if(!showAll)
            lst=lst.filter(r=>r.discovered);
        lst.forEach(r=>pool.push(r.toJSON()));
        return pool;
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
            if(this.industry!=null)
                this.industry.forEach(x=>buildings.push(x.toJSON()));
            this.depot.forEach(x=>buildings.push(x.toJSON()));
            if(this.institution!=null)
                this.institution.forEach(x=>buildings.push(x.toJson()));
            var payload={id:this.map.id,name:this.name,country:this.country.id,buildings:this.buildings,population:this.population.toJSON()}
            if(country==null)
                payload.resources=Resources.toJSON(this.resources,true)
            else
                payload.resources=Resources.toJSON(this.resources)
            return payload;
        }
        return {id:this.map.id,name:this.name,country:this.country.id}
    }

    static load(meta,countries,map){
        var country=countries.filter(c=>c.id==meta.country).get(0);
        var buildings=new SetList();
        var institution=new SetList();
        var industry=new SetList();
        //console.log(meta.population)
        var pop=new Population(meta.population.count,meta.population.birthRate,meta.population.deathRate,meta.population.education,meta.population.moral);
        if(meta.buildings!=undefined)
        meta.buildings.forEach(x=>{
            if(x.type=="Depot")
                buildings.add(Depot.load(x));
            else if(x.type=="Institution")
                institution.add(Institution.load(x));
            else if(x.type=="Industry")
                industry.add(Industry.load(x));
        });
        console.log(meta.resources)
        return new Province(map.provinces[meta.id],country,meta.name,pop,buildings,industry,institution,new SetList(),Resources.loadPool(meta.resources));

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
    getMovesPermitted(){
        var moves=0;
        moves+=this.provinces.length*2;
        //TODO: add more factors for number of moves
        return moves;
    }
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