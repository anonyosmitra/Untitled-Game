var socket;
var init=false;
var methods={};

function connectSocket(gid, user, s=true) {
    if(s)
        socket = new WebSocket("wss://fluidos.anonyo.net:8001");
    else
        socket = new WebSocket("ws://127.0.0.1:8001");
    socket.binaryType = "arraybuffer";
    socket.onopen = function() {
        var pay={action:"init",game:gid,player:user};
        socket.send(JSON.stringify(pay));
    }

    socket.onmessage = function(e) {
        //var enc = new TextDecoder("utf-8");
        //var arr = new Uint8Array(e.data);
        data=e.data;
        data=JSON.parse(data);
        console.log(data);
        methods[data.action](data);
    }

    socket.onclose = function(e) {
        console.log("socket closed!");
    }
    return socket;
}
function initResp(data){
    if(init){
        console.log("Received unrequested init Response")
        return;
    }
    init=true;
    data.map.forEach(t=>{
        if(t[2]){
            setTileColor(t[0],"water")
            setAbbr(t[0],"Water")
        }
        else if(t[1]!=null) {
            if (Province.provinces[t[1]] == undefined)
                new Province(t[1]);
            Province.provinces[t[1]].addTile(t[0])
            if(t[3]!=null)
                new Building(t[0],t[3],Province.provinces[t[1]])
        }

    });
}
function serverClosed(data){
    alert("Server is offline");
}
methods=Object.assign(methods, {"initResp":initResp,"Closing Server":serverClosed});