const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient('mongodb://dbserver.anonyo.net:27017', { useUnifiedTopology: true });
client.connect(function (){
    var cols=["Games","Gamedata","Chats","Messages"]
    var db=client.db("Untitled")
    cols.forEach(c=>{
        col=db.collection(c);
        col.deleteMany({});
    });
    client.close()
});