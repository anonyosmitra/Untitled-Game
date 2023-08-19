const fs = require('fs');
const SetList = require('./SetList.js')

const filePath = 'Maps/1.map';

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    data=data.split("\n");
    data=new SetList(data);
    let waterTiles=new SetList();
    let provinces={}
    let countries={}
    data.forEach(x=>{
        x=x.slice(1,x.length-1).split(", ").map(i=>parseInt(i));
       if(x[3]==1)
           waterTiles.add(x[0]);
       if(x[2]!=0){
           if(!countries.hasOwnProperty(x[1]))
               countries[x[1]]=new SetList();
           if(!provinces.hasOwnProperty(x[2]))
               provinces[x[2]]=new SetList();
           provinces[x[2]].add(x[0]);
           countries[x[1]].add(x[2]);
           deps=[null,"city","port","airport"]
           if (x[4]!=0){
               provinces[x[2]].add({tile:x[0],name:deps[x[4]]});
           }
       }
    });
    var pr=new SetList()
    for(i in Object.keys(provinces))
        if(Object.keys(provinces)[i]!=="undefined" && 0!=Object.keys(provinces)[i])
            pr.add({id:parseInt(Object.keys(provinces)[i]),tiles:provinces[Object.keys(provinces)[i]].toList()})
    provinces=pr;
    pr=new SetList()
    //console.log(Object.keys(countries))
    for(i in Object.keys(countries))
        if(Object.keys(countries)[i]!=="undefined" && 0!=Object.keys(countries)[i])
            pr.add({id:parseInt(Object.keys(countries)[i]),provinces:countries[Object.keys(countries)[i]].toList()})
    countries=pr;
    var map=JSON.stringify({waterTiles:waterTiles.toList(),provinces:provinces.toList(),countries:countries.toList()}, null, 2)
    console.log(map)
    fs.writeFile(filePath, map, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }});
    });