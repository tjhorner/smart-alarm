var moment = require('moment');

function TimeDifference(){
  this.diff = [0, "minutes"];
  this.type = "add"; // add/subtract
  this.humanReadableDescription = ""; // this is said to the user through text to speech if the
                                      // alarm is modified

  this.apply = function(time){
    var self = this;
    return time[self.type](self.diff[0], self.diff[1]);
  };
}

module.exports = TimeDifference;
