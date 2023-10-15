const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const https = require('https');
const WebS=require("./WebService");
const service=new WebS();
var wss;
async function  startUp() {
    console.log("Loading Data...");
    await service.load();
    try {
        const options = {
            key: fs.readFileSync('/home/ubuntu/keys/privkey.pem', 'utf8'),
            cert: fs.readFileSync('/home/ubuntu/keys/fullchain.pem', 'utf8'),
        };
        const server = https.createServer(options, (req, res) => {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('WebSocket server is running');
        });
        wss = new WebSocket.Server({server});
        server.listen(8001, () => {
            console.log("WSS server listening on port " + 8001);
        });
    } catch (e) {
        console.log("Error Loading SSL: " + e.message);
        wss = new WebSocket.Server({port: 8001});
        console.log("WS server listening on port " + 8001);
    }
    wss.on('connection', (sock,req) => {
        console.log('Client connected at: '+req.connection.remoteAddress);
        var con;
        if(req.connection.remoteAddress==="::ffff:13.232.160.45")
            con=new SockServ(sock);
        else
            con=new SockClient(sock);
        sock.on('message', (message) => {
            data=JSON.parse(message.toString());
            con.onMessage(data);
        });

        sock.on('close', () => {
            console.log('Client disconnected');
            con.onClose();
        });
    });
    wss.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
        this.send({"error":"Error processing request"});
    });
}
startUp();
process.on('SIGINT', async function () {
    console.log('Server is closing. Performing cleanup...');
    await service.stop();
    process.exit(0);
});


//app.listen(8001, () => {
  //  console.log('WebSocket server is listening on port 8001');
//});
class SockClient{
    constructor(sock) {
        this.sock=sock;
        this.game=null;
        this.player=null
        this.country=null;
    }
    send(data){
        data=JSON.stringify(data)
        this.sock.send(data);
    }
    onMessage(data){
        console.log(data)
        try {
            if(data.action=="test")
                this.send({"resp":"Ok","type":"client"})
            else if(data.action=="init")
                service.connectPlayer(this,data.game,data.player);
            else if(data.action=="sendMsg")
                service.newMsg(this,this.player.game,data)
            else if(data.action=="newChat"){
                service.newChat(this,data);
            }
            else if(data.action=="renameProv")
                service.renameProvince(this,data)
            else if(data.action=="skipTurn")
                service.skipTurn(this,data);

        }
        catch (e){
            console.log(e)
        }
    }

    onClose(){
        if(this.player!=null)
            this.player.disconnected();
    }
}
class SockServ{
    constructor(sock) {
        this.sock=sock;
    }
    send(data){
        data=JSON.stringify(data)
        this.sock.send(data);
    }
    onMessage(data){
        if(data.action=="test")
            this.send({"resp":"Ok","type":"server"});
        else if(data.action=="newUser"){
            service.newUser(data.name,data.pass,this);
        }
        else if(data.action=="login"){
            service.login(data.name,data.pass,this);
        }
        else if(data.action=="getUser"){
            service.getUser(data.cookie,this);
        }
        else if(data.action=="new game"){
            service.newGame(this);
        }
        else if(data.action=="getGameInfo"){
            if(data.hasOwnProperty("playerExists"))
                service.getGameInfo(this,data.game,data.playerExists);
            else
                service.getGameInfo(this,data.game);
        }
        else if(data.action=="joinGame") {
                service.joinGame(this,data.game,data.user,data.name)
        }
    }
    onClose(){

    }
}