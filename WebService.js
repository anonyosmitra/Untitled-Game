const SetList = require('./SetList.js')
const {User,Game,UserList,Chat,Message} = require('./DTOs2.js')
const Connection = require('./MongoConnection')
const {Map} = require('./Map.js')
class WebService {
    static con=null;
    async load() {
        await Map.load();
        if (WebService.con == null)
            WebService.con = new Connection();
        await User.loadUsers(WebService.con);
        await Game.loadGames(WebService.con).then(async e => {
            await Chat.loadChats(WebService.con);
        });

    }
    async stop(){
        await (Game.games.filter(g=>g.data!=null)).forEach(g=>g.save());
        if (WebService.con != null)
            await WebService.con.close();
    }
    async newUser(user,pass,sock){
        var usr=await User.newUser(user,pass,WebService.con);
        if(usr.constructor.name=="String")
            sock.send({error:usr})
        else
            sock.send({cookie:usr.id})
    }
    async login(user,pass,sock){
        var usr=User.users.findByName(user)
        if(usr!=null && await usr.checkPassword(pass)) {
            sock.send({cookie: usr.id})
        }
        else
            sock.send({error:"Invalid username or password"})
    }
    async getUser(userId,sock){
        var usr=User.users.findById(userId);
        if(usr==null)
            sock.send({error:"Invalid UserId"});
        else
            sock.send({name:usr.name,games:usr.games.map(x=>x.getTag())})
    }
    async newGame(sock){
        var gm=await Game.newGame(WebService.con);
        sock.send({id:gm.id});
    }

    async getGameInfo(sock, game, playerExists=null) {
        var res={}
        game=Game.findById(game);
        if(game==null){
            sock.send({error:"Invalid GameId"})
            return;
        }
        res.players=game.players.map(p=>p.getTag());
        if(playerExists!=null) {
            var a = game.players.filter(p => p.user.id == playerExists);
            res.exists=(a.length()==1)
        }
        sock.send(res);
    }
    async joinGame(sock,game,user,name){
        game=Game.findById(game);
        if(game==null){
            sock.send({error:"Invalid GameId"})
            return;
        }
        user=User.users.findById(user)
        if(user==null){
            sock.send({error:"Invalid UserId"})
            return;
        }
        var res=await game.addPlayer(WebService.con,user,name)
        if(res.constructor.name=="String")
            sock.send({error:res})
        else
            sock.send({success:true})
    }
    async newMsg(sock,game,data){
        var ch=Chat.chats.filter(c=>(c.game.id==game.id && c.id==data.chatId)).get(0)
        if(ch!=undefined)
            ch.onMessage(sock.player,data.message)
    }
    async connectPlayer(sock,game,user){
        game=Game.findById(game);
        try {
            if (game == null) {
                sock.send({error: "Invalid GameId"})
                return;
            }

            user = game.players.filter(p => p.user.id == user);
            if (user.length() == 0) {
                sock.send({error: "Invalid UserId"})
                return;
            }
            user = user.get(0)
            await user.connected(sock);
            var resps = [];
            resps.push({action: "loadMap", map: await game.data.map.getMapData()})
            resps.push({action: "updatePlayers", players: (await game.getPlayerTags(true)).toList()})
            resps.push({action: "updateCountries", countries: await game.data.getCountries()})
            resps.push({action: "loadChats", chats: await Chat.getChatsFor(sock.player)})
            await sock.send(resps);
            //TODO: Send Pieces;
        }
        catch (e){
            console.log(e)
        }
    }

    async newChat(sock, data) {
        var ok=false
        if(data.name==null)
            if(data.players.length==1) {
                var ch=(await Chat.getChatsForGame(sock.player.game)).filter(c => ((c.participants.length() == 2) && (c.participants.has(sock.player)) && (c.participants.has((sock.game.players.filter(p=>p.id==data.players[0])).get(0)))&&(c.name==null)))
                if(ch==null||ch.length()==0){
                    ok=true;
                }
            }
            else
                console.log("group chats must have a name");
            else
                ok=true;
        if(ok) {
            var plrs=new SetList()
            data.players.push(sock.player.user.id)
            data.players.forEach(pid=>{
                var p=sock.game.players.filter(pl=>pl.user.id==pid)
                if(p.length()>0)
                    plrs.add(p.get(0));
            })
            var cht=await Chat.newChat(sock.game, plrs,WebService.con, data.name);
            if(cht.constructor.name=="String")
                console.log(cht)
            else{
                var payload=[{action:"loadChats", chats:[await cht.getChats()]}]
                plrs.forEach(p=>{
                    if(p.sock!=null)
                        p.sock.send(payload)
                });
            }
        }
    }
}
module.exports=WebService;