const WebSocket = require('ws');

class Sock {
    static cookieOptions = {
        maxAge:7*24*60*60*1000 ,
        httpOnly: false
    };
    static s=""
    static async sendSock(pay,callback=null) {
        return new Promise((resolve) => {
            var socket=null
            if(s=="s")
                socket = new WebSocket("wss://fluidos.anonyo.net:8001");
            else
                socket = new WebSocket("ws://localhost:8001");
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
                if(callback==null)
                    resolve(data)
                else
                    callback(data)
            }
            socket.on('error', (error) => {
                console.log(error);
                socket.close();
            });
        });

    }

    static async home(req,res){
        if(req.cookies.untitled_uid===undefined){
            res.render('login',{usr:"",gameId:"",err:""});
        }
        else{
            Sock.sendSock({action:"getUser",cookie:req.cookies.untitled_uid}).then(r=>{
                res.render("Home",{info:r})
            });
        }
    }
    static async login(req,res){
        var r=await Sock.sendSock({action:"login",name:req.body.username,pass:req.body.password})
        if(r.hasOwnProperty("error"))
            res.render("login",{usr:req.body.username,gameId:req.body.gameId,err:r.error});
        else{
            res.cookie("untitled_uid",r.cookie,this.cookieOptions);
            if(req.body.gameId=="")
                res.redirect("/");
            else
                res.redirect("/game/"+req.body.gameId);
        }
    }
    static async game(req,res,gameId){
        if(req.cookies.untitled_uid===undefined){
            res.render('login',{usr:"",gameId:gameId,err:""});
        }
        var info=await Sock.sendSock({action:"getGameInfo", game:gameId,playerExists:req.cookies.untitled_uid});
        console.log(info)
        if(info.exists)
            res.render("Game",{gid:gameId,isSecure:(s=="s")});
        else if(info.hasOwnProperty("error")){
            res.status(404).send(info.error);
        }
        else{
            res.render("Join",{gid:gameId,error:"",info:info})
        }
    }
    static async joinGame(req,res,gameId){
        var info=await Sock.sendSock({action:"getGameInfo",game:gameId,playerExists:req.cookies.untitled_uid});
        if(info.exists)
            res.render("Game",{gid:gameId,isSecure:(s=="s")});
        else
            Sock.sendSock({action:"joinGame",user:req.cookies.untitled_uid,game:gameId,name:req.body.countryName}).then(async r => {
                if (r.hasOwnProperty("error")) {
                    res.render("Join",{gid:gameId,error:r.error,info:info})
                }
                else
                    res.render("Game",{gid:gameId,isSecure:(s=="s")});
            });

    }
    static logout(req,res){
        res.clearCookie("untitled_uid");
        res.redirect("/");
    }

    static async GameExists(id) {
        var data = await Sock.sendSock({"action": "game exists", "id": id})
    }
    static async signup(req,res){
        if(req.cookies.untitled_uid!=undefined)
            await Sock.home(req,res,gameId)
        else {
            if (req.body.hasOwnProperty("username"))
                Sock.sendSock({action:"newUser",name:req.body.username,pass:req.body.password}).then(r=>{
                if(r.hasOwnProperty("error"))
                    res.render("signup",{usr:req.body.username,pass:req.body.password,gameId:req.body.gameId,err:r.error})
                if(r.hasOwnProperty("cookie")) {
                    res.cookie("untitled_uid", r.cookie,this.cookieOptions);
                    if (req.body.gameId!="")
                        res.redirect("/game/"+req.body.gameId);
                    else
                        res.redirect("/");
                        }
                });
            else
                res.render('signup',{usr:"",pass:"",gameId:req.body.gameId,err:""});
                }
    }
    static async newGame(req,res){
        Sock.sendSock({action:"new game"}).then(gm=>res.redirect("/game/"+gm.id));
    }
}
module.exports=Sock;