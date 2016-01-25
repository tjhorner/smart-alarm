var gapi = require('googleapis'),
    calendar = gapi.calendar('v3'),
    OAuth2 = gapi.auth.OAuth2,
    moment = require('moment');

function GoogleCalendarMonitor(id, secret, accessToken, refreshToken){
  this.oauth = new OAuth2(id, secret, "http://localhost:3000/auth/google/callback");
  this.oauth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  console.log(this.oauth);

  this.indexedEvents = [];

  this.refresh = function(callback){
    self = this;
    calendar.events.list({
      auth: self.oauth,
      calendarId: "primary",
      timeMax: moment().hours(23).minutes(59).seconds(59).toISOString(),
      timeMin: moment().hours(0).minutes(0).seconds(0).toISOString()
    }, function(err, list){
      var events = list.items;
      events.forEach(function(event){
        var newEvents = [];
        if(self.indexedEvents.indexOf(event.id) === -1){
          self.indexedEvents.push(event.id);
          newEvents.push(event);
        }
        callback(newEvents);
      });
    });
  };
}

module.exports = GoogleCalendarMonitor;
