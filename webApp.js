//import makeMap from './game.mjs';
const WebS=require("./WebService");
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const service=new WebS();
const https = require('https');
const fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/static', express.static('static'));
app.use(cookieParser());
const options = {
    key: fs.readFileSync('/home/ubuntu/keys/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/home/ubuntu/keys/cert.pem', 'utf8'),
};
app.set('view engine', 'ejs');
async function  startUp(){
    console.log("starting up");
    await service.load();
    const server = https.createServer(options, app);

    server.listen(8000, () => {
        console.log("Application started and Listening on port 8000");
    });
}
startUp();
app.get("/game", (req, res) => {
    //let a=makeMap().grid;
    console.log("Got it!")
    //res.send("Ok");
    res.json({"response":"OK"});
});

app.get("/", (req, res) => {
    service.checkCookie(req.cookies.untitled_uid,res).then(usr=>res.render('Home',{games:usr.getPlayerTags()}));
});
var i=0;
app.get("/writeCookie",(req,res)=> {
    const cookieOptions = {
        maxAge: 3600000, // Cookie will expire in 1 hour (specified in milliseconds)
        httpOnly: false, // Cookie is accessible only by the server (not by JavaScript on the client side)
    };
  res.cookie("test",i,cookieOptions);
    console.log('Cookie set: '+i);
    res.send('Cookie set: '+i++);
});

app.get("/NewGame",(req,res)=>{
    service.newGame().then(gm=>res.redirect("/game/"+gm.id));
});
app.get("/game/:gid",(req,res)=>{
    let gid = req.params.gid;
   service.joinGame(req.cookies.untitled_uid,gid,res).then(p=>{
      if(p==null)
          res.render("Join",{gid:gid,error:""})
       else
           res.render("Game",{gid:gid,p:p});
   });
});
app.post("/game/:gid",(req,res)=> {
    let gid = req.params.gid;
    var form=req.body;
    service.addPlayer(req.cookies.untitled_uid,gid,form["countryName"],req).then(p=>{
        if(p.constructor.name=="String")
            res.render("Join",{gid:gid,error:p});
        else
            res.render("Game",{gid:gid,p:p});
    });
});
app.get("/readCookie",(req,res)=>{
   var c=req.cookies.test;
    console.log('Cookie read: '+(c==undefined));
    res.send('Cookie read: '+c);
});
app.on('close', async () => {
    // Perform cleanup or any necessary logic before the server is closed

    // Example: Close database connections, release resources, etc.
});
process.on('SIGINT', async function () {
    console.log('Server is closing. Performing cleanup...');
    await service.stop();
    process.exit(0);
});