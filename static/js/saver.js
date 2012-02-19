/*
  saver.js connects to #save-button and #update-button to save as new and update the current meshu, respectively
*/
var saver = function() {
  var self = {},
      postSave = null;

  // the object we send to the server to be saved/updated
  function getMeshuXHR(meshu) {
    return {
      'xhr': 'true',
      'title' : meshu.outputTitle(),
      'svg': meshu.outputSVG(),
      'location_data' : meshu.outputLocationData()
    }
  }

  function updateMeshuID(id) {
    if (!id) return;

    if ($("#meshu-id").length == 0)
      $("#hidden-form-values").append('<input type="hidden" id="meshu-id" name="meshu_id" />');

    $("#meshu-id").val(id);
  }

  self.initialize = function(meshu) {
    // this only applies to usermade meshus
    $("#save-button").click(function() {
      if (!loadedMeshu) return;
      
      $("#save-button").html('saving');

      var saveurl = loadedMeshu.edit_url + 'save';
      $.get(saveurl, getMeshuXHR(meshu), function(data) {

          // create new meshu_id element in the form
          updateMeshuID(data.meshu_id);

          setTimeout(function() {
            $("#save-button").html('saved!');
          }, 200);

          if (postSave)
            setTimeout(postSave, 500);

          setTimeout(function() {
            // $("#save-button").html('save as new');
            window.location.href = window.location.href.split('/').shift() + data.meshu_url;
          }, 1000);
        }, 'json');
    });

    // update this meshu
    $("#update-button").click(function() {
      if (!loadedMeshu) return;

      $("#update-button").html('updating');

      var updateurl = loadedMeshu.edit_url + 'update';
      $.get(updateurl, getMeshuXHR(meshu), function(data) {

          // create new meshu_id element in the form
          updateMeshuID(data.meshu_id);

          setTimeout(function() {
            $("#update-button").html('saved!');
          }, 200);

          if (postSave) 
            setTimeout(postSave, 500);

          setTimeout(function() {
            // $("#update-button").html('save current');
            window.location.href = window.location.href.split('/').shift() + data.meshu_url;
          }, 1000);
        }, 'json');

    });

    return self;
  };

  self.saved = function(s) {
    if (!arguments.length) return postSave;

    postSave = s;
    return self;
  };

  return self;
}();