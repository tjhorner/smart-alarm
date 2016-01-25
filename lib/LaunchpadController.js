var LaunchpadMK2 = require('launchpad-mk2');

function LaunchpadController(launchpad){
  this.pulse = function(){
    var color_stops = [
      [0,0,255],
      [0,0,0],
    ];

    var update_ticks = 10;
    var ticks_between_stops = 5000;

    var current_stop_position = Math.floor(Math.random()*color_stops.length);
    var current_ticks = Math.floor(Math.random()*ticks_between_stops);
    var on_tick = function(){
      // Get information on where we're going and where we've been
      var next_stop_position = current_stop_position + 1;
      if (next_stop_position >= color_stops.length) {
        next_stop_position = 0;
      }

      var previous_color_stop = color_stops[current_stop_position];
      var next_color_stop = color_stops[next_stop_position];
      var current_percent = current_ticks/ticks_between_stops;

        // Update the color
      var linear_interpolate = function(old_value, new_value, percent) {
        return Math.round(old_value + ((new_value - old_value) * percent));
      }

      var new_color = [
        linear_interpolate(previous_color_stop[0], next_color_stop[0], current_percent),
        linear_interpolate(previous_color_stop[1], next_color_stop[1], current_percent),
        linear_interpolate(previous_color_stop[2], next_color_stop[2], current_percent)
      ];

      launchpad._output.sendMessage([240, 0, 32, 41, 2, 16, 10, 99, LaunchpadMK2.getColor(new_color[0], new_color[1], new_color[2]), 247]);
      launchpad.lightAll(LaunchpadMK2.getColor(new_color[0], new_color[1], new_color[2]));
      // document.body.parentNode.style.background = 'rgb('+new_color[0]+','+new_color[1]+','+new_color[2]+')';
      // document.body.style.background = 'rgb('+new_color[0]+','+new_color[1]+','+new_color[2]+')';

      // Increment how far we are
      current_ticks += update_ticks;

      // If we're past the threshhold for switching colors, switch colors
      if (current_ticks >= ticks_between_stops) {
        current_ticks = 0;
        current_stop_position += 1;

        // If we're at the end of the stops, wrap to the beginning
        if (current_stop_position >= color_stops.length) {
          current_stop_position = 0;
        }
      }
    }

    on_tick();
    setInterval(on_tick, update_ticks);
  }

  this.drawTheThing = function(){
    launchpad.darkAll();

    launchpad._output.sendMessage([240, 0, 32, 41, 2, 16, 10, 99, 0, 247]);

    var things = [
      [3, 8],
      [4, 8],
      [5, 8],
      [6, 8],
      [6, 7],
      [6, 6],
      [6, 5],
      [6, 4],
      [6, 3],
      [6, 2],
      [6, 1],
      [5, 1],
      [4, 1],
      [3, 1],
      [3, 2],
      [3, 3],
      [3, 4],
      [3, 5],
      [3, 6],
      [3, 7]
    ];

    var currentMode = "light",
        currentLightIndex = 0;

    setInterval(function(){
      if(currentLightIndex + 1 > things.length){
        currentLightIndex = 0;
        currentMode = currentMode === "light" ? "dark" : "light";
      }
      if(currentMode === "light"){
        launchpad.getButton(things[currentLightIndex][1], things[currentLightIndex][0]).setColor(Math.floor((Math.random() * 127) + 1));
      }else{
        launchpad.getButton(things[currentLightIndex][1], things[currentLightIndex][0]).darken();
      }
      currentLightIndex++;
    }, 50);
  };
}

module.exports = LaunchpadController;
