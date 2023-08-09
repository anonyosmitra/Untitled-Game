const WebSocket = require('ws');

class Sock {
    static async sendSock(pay) {
        return new Promise((resolve) => {
            const socket = new WebSocket("wss://fluidos.anonyo.net:8001");
            //const socket = new WebSocket("ws://localhost:8001");
            //socket.binaryType = "arraybuffer";
            socket.onopen = function () {
                socket.send(JSON.stringify(pay));
            }

            socket.onmessage = function (e) {
                //var enc = new TextDecoder("utf-8");
                //var arr = new Uint8Array(e.data);
                //var data = enc.decode(arr);
                let data = e.data;
                data = JSON.parse(data);
                socket.close();
                resolve(data)
            }
            socket.on('error', (error) => {
                console.log(error);
                socket.close();
            });
        });

    }

    static async newGame() {
        var data = await Sock.sendSock({"action": "new game"})
        console.log(data.id);

    }

    static async GameExists(id) {
        var data = await Sock.sendSock({"action": "game exists", "id": id})
        console.log(data.resp);
    }
}
Sock.sendSock({"message":"Hello World"}).then(p=>console.log(p));
module.exports=Sock;