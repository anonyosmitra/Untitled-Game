const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const https = require('https');
const webSock=null;
const options = {
    key: fs.readFileSync('/home/ubuntu/keys/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/home/ubuntu/keys/fullchain.pem', 'utf8'),
};
//const server = new WebSocket.Server({port:8001});
const server = https.createServer(serverOptions, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

// Create a WebSocket server using the HTTPS server
const wss = new WebSocket.Server({ server });
wss.on('connection', (sock,req) => {
    console.log('Client connected at: '+req.connection.remoteAddress);
    if(req.connection.remoteAddress==="::ffff:127.0.0.1")
        console.log("Internal");
    var con=new SockClient(sock);
    sock.on('message', (message) => {
        data=JSON.parse(message.toString());
        con.onMessage(data);
    });

    sock.on('close', () => {
        console.log('Client disconnected');
    });
});
server.listen(8001, () => {
    console.log('WebSocket server is listening on port 8001');
});

//app.listen(8001, () => {
  //  console.log('WebSocket server is listening on port 8001');
//});
class SockClient{
    constructor(sock) {
        this.sock=sock;
        this.game=null;
        this.player=null
    }
    send(data){
        data=JSON.stringify(data)
        this.sock.send(data);
    }
    onMessage(data){
        this.send({"resp":"Message Received"});
    }

    onClose(){

    }
}