const WebSocket = require('ws');
const http = require('http');

const app = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

const server = new WebSocket.Server({port:8001});

server.on('connection', (sock,req) => {
    console.log('Client connected at: '+req.connection.remoteAddress);
    var con=new SockClient(sock);
    sock.on('message', (message) => {
        data=JSON.parse(message.toString());
        con.onMessage(data);
    });

    sock.on('close', () => {
        console.log('Client disconnected');
    });
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
        console.log(data)
        this.sock.send(data);
    }
    onMessage(data){
        console.log(data);
        this.send({"resp":"Message Received"});
    }

    onClose(){

    }
}