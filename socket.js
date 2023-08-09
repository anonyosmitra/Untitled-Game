const WebSocket = require('ws');

async function sendSock(pay) {
    return new Promise((resolve) => {
    socket = new WebSocket("ws://localhost:8001");
    socket.binaryType = "arraybuffer";
    socket.onopen = function() {
        socket.send(JSON.stringify(pay));
    }

    socket.onmessage = function(e) {
        var enc = new TextDecoder("utf-8");
        var arr = new Uint8Array(e.data);
        data=enc.decode(arr);
        data=JSON.parse(data);
        socket.close();
        resolve(data);
    }
    socket.on('error', (error) => {
            reject(error);
            socket.close();
        });
});

}
async function newGame(){
    data=await sendSock({"action":"new game"})
    console.log(data.id);

}
async function GameExists(id){
    data=await sendSock({"action":"game exists","id":id})
    console.log(data.resp);
}