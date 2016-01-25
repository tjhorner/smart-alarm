var config = require('./config.json'),
    express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    moment = require('moment'),
    // CronJob = require('cron').CronJob,
    // fb = require('fb'),
    Twilio = require('twilio'),
    twilio = new Twilio(config.key.twilio.api, config.secret.twilio.api),
    TimeDifference = require('./lib/TimeDifference'),
    TimeOverride = require('./lib/TimeOverride'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    GoogleCalendarMonitor = require('./lib/GoogleCalendarMonitor'),
    GoogleStrategy = require('passport-google-oauth2').Strategy,
    session = require('express-session'),
    LaunchpadController = require('./lib/LaunchpadController'),
    GOL = require('./lib/gameoflife.js');

var baseAlarm = moment("Sat Jan 23 2016 09:00:00 GMT-0500 (EST)"),
    overrideAlarm,
    alarmMods = [],
    alarmDismissed = false,
    alarmEnabled = true;

var LaunchpadMK2 = require('launchpad-mk2'),
    getColor = LaunchpadMK2.getColor,
    launchpad = new LaunchpadMK2.connect({
      in: 1,
      out: 1,
      type: LaunchpadMK2.types.PRO
    }),
    lpController = new LaunchpadController(launchpad);

// lpController.pulse();
// lpController.drawTheThing();

function getCurrentAlarm(){
  if(overrideAlarm){
    return {
      alarm: overrideAlarm.override,
      override: true,
      reason: overrideAlarm.reason
    };
  }else{
    return {
      alarm: baseAlarm,
      override: false,
      reason: null
    };
  }
}

function getAlarmMods(){
  var mods = [];
  if(overrideAlarm) mods.push(overrideAlarm);
  alarmMods.forEach(function(mod){
    mods.push(mod);
  });
  return mods;
}

passport.use(new GoogleStrategy({
    clientID: config.key.google.consumer,
    clientSecret: config.secret.google.consumer,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: false
  },
  function(accessToken, refreshToken, profile, done) {
    // console.log(profile);
    // console.log("ACCESS FUCKING TOKEN", accessToken);
    var monitor = new GoogleCalendarMonitor(config.key.google.consumer, config.secret.google.consumer, accessToken, refreshToken);
    monitor.refresh(function(events){
      events.forEach(function(event){
        var startTime = moment(event.start.dateTime);
        overrideAlarm = new TimeOverride(startTime.subtract(1, "hour"), event.summary + " is on your Google Calendar");
      });
      done(null, profile);
    });
  }
));

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(obj, done){
  done(null, obj);
});

app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: "KKkdkckowkkofkleklkflk"
}));
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

io.on('connection', function(socket){
  socket.on("alarm:mods:get", function(){
    socket.emit("alarm:mods", getAlarmMods());
  });

  socket.on("alarm:time:get", function(){
    socket.emit("alarm:time", getCurrentAlarm().alarm.format("h:mm A"));
  });
});

setInterval(function(){
  if(getCurrentAlarm().alarm.format("h:mm A") === moment().format("h:mm A") && !alarmDismissed){
    alarmDismissed = true;
    io.emit("alarm:beep");

    setTimeout(function(){
      lpController.drawTheThing();
    }, 6000);

    twilio.makeCall({
      to: '+17606771329', // Any number Twilio can call
      from: '+17606422914', // A number you bought from Twilio and can use for outbound communication
      url: 'http://d246a48e.ngrok.io/twilio' // A URL that produces an XML document (TwiML) which contains instructions for the call
    }, function(err, responseData) {
      if(err) console.log("errrrr", err);
      console.log(responseData.from);
    });
  }
}, 1000);

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback',
	passport.authenticate('google', {
		successRedirect: '/',
		failureRedirect: '/auth/google/failure'
}));

app.post("/twilio", function(req, res){
  var response = new Twilio.TwimlResponse();

  response.say("Good morning!");
  response.say("It's " + moment().format("h") + " " + moment().minutes() + " " + moment().format("A") + ".");

  getAlarmMods().forEach(function(mod){
    response.say(mod.humanReadableDescription ? mod.humanReadableDescription : mod.reason);
  });

  res.setHeader("Content-Type", "application/xml");
  res.send(response.toString());
});

app.post("/alarm/override", function(req, res){
  var dateTimeOverride = moment().hours(req.body.hour).minutes(req.body.minute);
  var override = new TimeOverride(dateTimeOverride, req.body.reason);

  overrideAlarm = override;

  io.emit("alarm:mods", getAlarmMods());
  io.emit("alarm:time", getCurrentAlarm().alarm.format("h:mm A"));

  res.send({
    mods: getAlarmMods(),
    enabled: alarmEnabled,
    alarm: getCurrentAlarm().alarm.toDate()
  });
});

app.get("/alarm", function(req, res){
  res.send({
    mods: getAlarmMods(),
    enabled: alarmEnabled,
    alarm: getCurrentAlarm().alarm.toDate()
  });
});

app.post("/alarm/mod", function(req, res){
  var mod = new TimeDifference();
  mod.type = req.body.type;
  mod.humanReadableDescription = req.body.desc;
  mod.diff = [req.body.time, req.body.interval];

  mod.apply(getCurrentAlarm().alarm);
  alarmMods.push(mod);

  io.emit("alarm:mods", getAlarmMods());
  io.emit("alarm:time", getCurrentAlarm().alarm.format("h:mm A"));

  res.send({
    mods: getAlarmMods(),
    enabled: alarmEnabled,
    alarm: getCurrentAlarm().alarm.toDate()
  });
});

app.post("/alarm/toggle", function(req, res){
  alarmEnabled = (req.body.enabled === "true");
  res.send({
    mods: alarmMods,
    enabled: alarmEnabled,
    alarm: alarm.toDate()
  });
});

http.listen(process.env.PORT || 3000);

// setInterval(function(){
//   launchpad.buttons.forEach(function(button){
//     button.setColor(getColor(Math.floor((Math.random() * 255) + 1), Math.floor((Math.random() * 255) + 1), Math.floor((Math.random() * 255) + 1)));
//   });
// }, 100);

launchpad.darkAll();

function generateRandomBoard(){
  var board = [];
  for(var i = 0; i < 10; i++){
    var boardRow = [];
    for(var i2 = 0; i2 < 10; i2++){
      boardRow.push((Math.random() > 0.5 ? 1 : 0));
    }
    board.push(boardRow);
  }
  return board;
}

var gol = new GOL(launchpad);
gol.init(1);
gol.board = generateRandomBoard();
// gol.board = [
//   [0,1,0,0,0,0,0,0,0,0],
//   [0,1,1,0,0,0,0,0,0,0],
//   [0,0,0,0,0,0,0,0,0,0],
//   [0,0,0,0,0,0,0,1,0,0],
//   [0,0,0,0,1,0,1,1,0,0],
//   [0,0,0,1,1,0,0,0,0,0],
//   [0,0,0,0,0,0,0,0,1,0],
//   [0,1,0,0,1,1,1,0,0,0],
//   [0,0,0,0,0,0,0,0,1,0],
//   [0,0,0,0,0,0,0,0,0,0]
// ];

var lastBoard = [];

setInterval(function(){
  // lastBoard = gol.board;

  gol.print();
  gol.nextGen();

  // if(gol.board === lastBoard){
  //   gol.board = [
  //     [0,1,0,0,0,0,0,0,0,0],
  //     [0,1,1,0,0,0,1,0,0,0],
  //     [0,0,0,0,0,0,0,0,0,0],
  //     [0,0,0,0,0,0,0,1,0,0],
  //     [0,0,0,0,1,0,0,1,0,0],
  //     [0,0,0,1,1,1,0,0,0,0],
  //     [0,0,0,0,1,0,0,0,1,0],
  //     [0,1,0,0,1,1,1,0,0,0],
  //     [0,0,0,0,0,0,0,0,0,0],
  //     [0,0,0,0,0,0,0,0,0,0]
  //   ];
  // }
}, 500);
