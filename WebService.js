const SetList = require('./SetList.js')
const {User,Game,UserList} = require('./User.js')
const Connection = require('./MongoConnection')
class WebService {
    static cookieOptions = {
        maxAge: 315360000000,
        httpOnly: false
    };
    static con=null;
    async load() {
        if (WebService.con == null)
            WebService.con = new Connection();
        await User.loadUsers(WebService.con);
        await Game.loadGames(WebService.con);
    }
    async stop(){
        if (WebService.con != null)
            await WebService.con.close();
    }
    async newGame(){
        var gm=await Game.newGame(WebService.con);
        return gm;
    }
    async newUser(){
        return User.newUser(WebService.con);
    }
    async checkCookie(cookie,res){
        var usr=null
        if(cookie==undefined || User.users.findById(cookie)==null){
            usr=await this.newUser(WebService.con);
            res.cookie("uid",usr.id);
        }
        else
            usr=User.users.findById(cookie);
        return usr;
    }
    async addPlayer(cookie,gid,name,res){
        var usr=User.users.findById(cookie);
        var gm=Game.findById(gid);
        if(usr==null) {
            return "Invalid User";
        }
        if(gm==null) {
            return "Invalid Game";
        }
        if(name=="Test")
            return "Invalid Name";
        var player=await gm.addPlayer(WebService.con,usr,name)
        if(player==null)
            return "Name Already Exists In Game";
        return player;

    }
    async joinGame(cookie,gid,res){
        var gm=Game.findById(gid);
        if(gm==null)
            res.status(404).send("Game Not Found!");
        else {
            var user=await this.checkCookie(cookie, res);
            return gm.players.findById(cookie)
        }

    }
}
module.exports=WebService;
