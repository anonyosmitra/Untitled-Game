const Resources={
    oil: "oil",
    iron: "iron",
    wind: "wind",
    fertile: "fertile",
    sun: "sun",
    forest: "forest",
    sand: "sand",
    uranium: "uranium",
    Lithium: "lithium"
}
class Resource{
    constructor(res:Resources,quantity:number,renewalRate:number) {
        this.resource=res;
        this.quantity=quantity;
        this.renewalRate=renewalRate;
    }
}
class Tile{
    constructor(id:number,row:number,column:number,province=null,isWater=false) {
        this.id=id;
        this.row=row;
        this.column=column;
        this.province=province;
        this.isWater=isWater;
        this.isCoastal=false;//Todo implement coastline
        this.contains=null;
    }
}
class Capital{
    constructor(province:Province,tile:Tile) {
        this.loc=tile;
        this.province=province;
        tile.contains=this;
        province.capital=this;
    }
}
class Population{
    constructor(province:Province) {
        this.province=province;
        province.population=this;
        this.demo=[0,0,0,0,0,0,0,0,0,0,0,0];//[0-10,11-20,21-30,31-40,41-50,51-60,61-70,71-80,81-90,91-100,101-110,111,-120]
        this.edu=30;
        this.health=40;
    }
}
class Institute{

}
class Hospital extends Institute{

}

class School extends Institute{

}
class Lab extends Institute{

}
class MedicalLab extends Lab{

}

class EngineeringLab extends Lab{

}
class Province{
    constructor(country) {
        this.tiles=[];
        this.country=country;
        this.capital=null;
        this.population=null;
        this.institutions=[];
        this.productions=[];
    }

}
class Country{
    constructor(name,color) {
        this.provinces=[];
        this.energy=100;
        this.color=color;
        this.name=name;
        this.money=100000;
    }
}
class Map{
    constructor() {
        this.grid=[];
        this.loc={};
    }
}
