$(document).ready(function(){
  var socket = io();

  socket.on("alarm:mods", function(mods){
    console.log(mods);
    $("table").text("");
    mods.forEach(function(mod){
      if(mod.isOverride){
        $("table").append("<tr>" +
                            "<td>" + mod.reason + "</td>" +
                            "<td><b>overrides your set alarm</b></td>" +
                          "</tr>");
      }else{
        $("table").append("<tr>" +
                            "<td>" + mod.humanReadableDescription + "</td>" +
                            "<td><b>" + mod.type + "s " + mod.diff[0] + " " + mod.diff[1] + "</b></td>" +
                          "</tr>");
      }
    });
  });

  socket.on("alarm:time", function(datetime){
    $("#alarm").text(datetime);
  });

  socket.on("alarm:beep", function(){
    alert("beep beep motherfucker");
  });

  socket.emit("alarm:time:get");
  socket.emit("alarm:mods:get");
});
