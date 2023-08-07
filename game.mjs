import * as classes from './classes.mjs';
function makeMap(){
    let map=new Map();
    let id=1;
    for(let i=1; i<13;i++){
        let row=[]
        for(let j=1;j<13;j++){
            let t=new Tile(id,i,j)
            t.contains=id;
            row.add(i);
            map.loc[id]=t;
        }
        map.grid.add(row);
    }
    return map;
}
module.exports={makeMap};