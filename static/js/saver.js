/*
saver.js connects to #save-button and #update-button to save as new and update the current meshu, respectively
*/
var saver = function() {
    var self = {};

    // the object we send to the server to be saved/updated
    function getMeshuXHR() {
        return {
          'xhr': 'true',
          'title' : self.meshu.outputTitle(),
          'svg': self.meshu.outputSVG(),
          'location_data' : self.meshu.outputLocationData()
        };
    }

    function updateMeshuID(id) {
        if (!id) return;

        if ($("#meshu-id").length == 0)
          $("#hidden-form-values").append('<input type="hidden" id="meshu-id" name="meshu_id" />');

        $("#meshu-id").val(id);
    };

    function createNewMeshu() {
        var xhr = getMeshuXHR();
        xhr.csrfmiddlewaretoken = $("#csrf input").val();

        // if we've made one already, set the id
        if ($("#meshu-id").length)
            xhr.id = parseInt($("#meshu-id").val());

        // push this
        $.post('/make/create/', xhr, function(data) {
            // create new meshu_id element in the form
            updateMeshuID(data.meshu_id);

            if (self.postCreateCallback) {
              self.postCreateCallback();
            }

        }, 'json');
    }

    self.initialize = function(meshu, view_url) {
        self.meshu = meshu;

        $("#cancel-button").click(function() {
          window.location.href = view_url;
        });

        // this only applies to usermade meshus
        $("#save-button").click(function() {
          if (!loadedMeshu) return;
          
          $("#save-button").html('saving');

          var saveurl = loadedMeshu.edit_url + 'save';
          $.get(saveurl, getMeshuXHR(), function(data) {

              // create new meshu_id element in the form
              updateMeshuID(data.meshu_id);

              setTimeout(function() {
                $("#save-button").html('saved!');
              }, 200);

              setTimeout(function() {
                window.location.href = data.meshu_url;
              }, 1000);
            }, 'json');
        });

        // update this meshu
        $("#update-button").click(function() {
          if (!loadedMeshu) return;

          $("#update-button").html('updating');

          var updateurl = loadedMeshu.edit_url + 'update';
          $.get(updateurl, getMeshuXHR(), function(data) {

              // create new meshu_id element in the form
              updateMeshuID(data.meshu_id);

              setTimeout(function() {
                $("#update-button").html('saved!');
              }, 200);

              setTimeout(function() {
                window.location.href = data.meshu_url;
              }, 1000);
            }, 'json');

        });

        return self;
    };

    self.initializeNewMeshu = function(meshu) {
        self.meshu = meshu;
        return self;
    };

    self.createOrUpdateMeshu = function() {

        createNewMeshu();

        return self;
    };

    return self;
}();