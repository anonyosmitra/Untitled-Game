const { MongoClient } = require('mongodb');

const uri = 'mongodb://dbserver.anonyo.net:27017'; // Replace with your MongoDB connection URI

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
class Connection{
    printError(er,result){
        if (err) {
            console.error('Error inserting document:', err);
        }
    }
    async connect() {
        try {
            await this.con.connect();
            console.error("connected!!");

        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
        }
    }
    constructor() {
        this.con = new MongoClient(uri, options);
        this.connect()
    }
    async close() {
        console.log("Closing Connection");
        this.con.close();
    }
    async insert(db, col, item,ret=null) {
        var collection = this.con.db(db).collection(col);
        if (item.constructor.name == "Set")
            item = Array.from(item);
        if (item.constructor.name == "SetList")
            item.item.toList();
        var a=null;
        if (item.constructor.name == "Array")
            a=await collection.insertMany(item, this.printError);
        else
            a=await collection.insertOne(item, this.printError);
        if(ret==null)
            return a;
        else
            return ret(a);
    }
    async find(db, col, data,ret=null) {
        var collection = this.con.db(db).collection(col);
        var a=await collection.find(data).toArray()
        if(ret==null)
            return a;
        else
            return ret(a);
    }
    async update(db,col,where,change,ret=null){
        var collection = this.con.db(db).collection(col);
        var a=await collection.updateMany(where,{ $set: change });
        if(ret==null)
            return a;
        else
            return ret(a);
    }
    async delete(db,col,where,ret=null){
        var collection = this.con.db(db).collection(col);
        var a=await collection.deleteMany(where);
        if(ret==null)
            return a;
        else
            return ret(a);
    }
}
module.exports=Connection;