const Connection = require('./MongoConnection')
var con=new Connection();
var cols=["Games","Gamedata","Chats","Messages"]
var db=con.con.db("Untitled")
cols.forEach(c=>{
    col=db.collection(c);
    col.deleteMany({});
});
con.close()