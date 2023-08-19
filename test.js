const SetList = require('./SetList.js')
const fs = require("fs");
a=new SetList()
const filePath = 'Maps/neighbour.data';

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }
    data=data.split("\n");
    var info={}
    data.forEach(x=>{
        x=x.slice(1,x.length-1);
        x=x.split(", ");
        x=x.map(i=>parseInt(i));
        console.log(x)
        info[x[0]]={"West":x[1],"East":x[2],"North West":x[3],"North East":x[4],"South West":x[5],"South East":x[6]}
    })
    fs.writeFile(filePath, JSON.stringify(info,null,2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }});
});