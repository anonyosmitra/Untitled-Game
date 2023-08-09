var socket;
function connectSocket() {
    socket = new WebSocket("ws://fluidos.anonyo.net:8001");
    socket.binaryType = "arraybuffer";
    socket.onopen = function() {
        var pay={"message":"Hello World!"};
        socket.send(JSON.stringify(pay));
    }

    socket.onmessage = function(e) {
        var enc = new TextDecoder("utf-8");
        var arr = new Uint8Array(e.data);
        data=enc.decode(arr);
        data=JSON.parse(data);
        console.log(data["response"]);
    }

    socket.onclose = function(e) {
        console.log("socket closed!");
    }
}