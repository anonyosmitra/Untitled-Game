var socket;
function connectSocket(gid,user,s=true) {
    if(s)
        socket = new WebSocket("wss://fluidos.anonyo.net:8001");
    else
        socket = new WebSocket("ws://127.0.0.1:8001");
    socket.binaryType = "arraybuffer";
    socket.onopen = function() {
        //var pay={action:"init",game:gid,player:user};
        var pay={action:"test"}
        socket.send(JSON.stringify(pay));
    }

    socket.onmessage = function(e) {
        //var enc = new TextDecoder("utf-8");
        //var arr = new Uint8Array(e.data);
        data=e.data;
        data=JSON.parse(data);
        console.log(data);
    }

    socket.onclose = function(e) {
        console.log("socket closed!");
    }
    return socket;
}