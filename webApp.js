const Sock=require("./socket");
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const https = require('https');
const fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/static', express.static('static'));
app.use(cookieParser());

app.set('view engine', 'ejs');
async function  startUp(){
    console.log("starting up");
    try {
        const options = {
            key: fs.readFileSync('/home/ubuntu/keys/privkey.pem', 'utf8'),
            cert: fs.readFileSync('/home/ubuntu/keys/fullchain.pem', 'utf8'),
        };
        const server = https.createServer(options, app).listen(8000, function () {
            console.log("HTTPS server listening on port " + 8000);
        });
        Sock.s="s"
    }
    catch (e){
        console.log("Error Loading SSL: "+e.message);
        app.listen(8000, () => {
            console.log("HTTP server listening on port " + 8000);
        });
    }
}
app.get("/game", (req, res) => {
    res.json({"response":"OK"});
});

app.get("/", (req, res) => {
    Sock.home(req,res);
});
app.get("/logout",(req,res)=>{
   Sock.logout(req,res);
});
app.post("/login",(req,res)=>{
   Sock.login(req,res);
});
app.get("/signup",(req,res)=>{
    Sock.signup(req,res)
});
app.post("/signup",(req,res)=>{
   Sock.signup(req,res);
});

app.get("/NewGame",(req,res)=>{
    Sock.newGame(req,res);
});
app.get("/game/:gid",(req,res)=>{
    let gid = req.params.gid;
    Sock.game(req,res,gid);
});
app.post("/game/:gid",(req,res)=> {
    let gid = req.params.gid;
    Sock.joinGame(req,res,gid);
});
app.get("/readCookie",(req,res)=>{
   var c=req.cookies.test;
    console.log('Cookie read: '+(c==undefined));
    res.send('Cookie read: '+c);
});

app.get("/wstTest",(req,res)=>{
    Sock.sendSock({action:"test"}).then(p=>res.send(p));
});

app.on('close', async () => {
    // Perform cleanup or any necessary logic before the server is closed

    // Example: Close database connections, release resources, etc.
});
process.on('SIGINT', async function () {
    console.log('Server is closing. Performing cleanup...');
    //await service.stop();
    process.exit(0);
});
startUp();