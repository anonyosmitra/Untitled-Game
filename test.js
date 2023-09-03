const Connection = require('./MongoConnection')
var con=new Connection();
var db=con.con.db("Untitled")
db.collection("Games").deleteMany({})
db.collection("Gamedata").deleteMany({})
db.collection("Chats").deleteMany({})
db.collection("Messages").deleteMany({})
con.close()