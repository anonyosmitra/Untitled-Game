const SetList = require('./SetList.js')
const {User,Game,UserList} = require('./DTOs2.js')
const Connection = require('./MongoConnection')
const {Map} = require('./Map.js')
class WebService {
    static con=null;
    async load() {
        await Map.load();
        if (WebService.con == null)
            WebService.con = new Connection();
        await User.loadUsers(WebService.con);
        await Game.loadGames(WebService.con).then(async x => {
        });
    }
    async stop(){
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
        console.log(res)
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
}
module.exports=WebService;