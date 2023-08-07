const SetList=require('./SetList');
const Connection = require('./MongoConnection')

//console.log(con.insert("test","items",{"id":3, "name":"Anonyo"}).then(()=>con.close()));
a=null;
//con._find("test","items",{"id":3}).then((x)=>{con.close();a=x;})
//a=run(con,"test","items",{"id":3});
//console.log(a);
function x(a){
    console.log(a);
    con.close();
}
class Person{
    constructor(id,name) {
        this.id=id;
        this.name=name;
    }
}
async function test(){
    var con = new Connection();
    var p=new Person(5,"test Person");
    await con.insert("test","items",p);
    await con.close();
}
test();
//con.delete("test","items",{}).then(con.close);
//con.find("test","items",{"id":3}).then(x);
//con.find("test","items",{"id":3},x);
//con.update("test","items",{"id":3},{"name":"new name1"},()=>con.close())
//con.delete("test","items",{"id":3},()=>con.close())
