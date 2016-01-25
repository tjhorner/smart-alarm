$(document).ready(function(){
  $("#mod").click(function(){
    $.ajax({
      url: "/alarm/mod",
      type: "POST",
      data: {
        desc: $("#desc").val(),
        type: $("#type").val(),
        time: $("#time").val(),
        interval: $("#interval").val()
      }
    });
  });

  $("#override").click(function(){
    $.ajax({
      url: "/alarm/override",
      type: "POST",
      data: {
        hour: ($("#ampm").val() === "PM" ? (parseInt($("#hour").val()) + 12) : parseInt($("#hour").val())),
        minute: $("#minute").val(),
        reason: $("#reason").val()
      }
    });
  });
});
