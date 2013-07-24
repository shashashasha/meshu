/*
saver.js connects to #save-button and #update-button to save as new and update the current meshu, respectively
*/
var saver = function() {
    var self = {},
        meshuID = "#meshu-id";

    // the object we send to the server to be saved/updated
    function getMeshuXHR() {
        var xhr = self.meshu.xhr();
        xhr.csrfmiddlewaretoken = $("#csrf input").val();
        return xhr;
    }

    function updateMeshuID(id) {
        if (!id) return;

        self.meshu.id = id;

        if ($(meshuID).length == 0)
          $("#hidden-form-values").append('<input type="hidden" id="meshu-id" name="meshu_id" />');

        $(meshuID).val(id);
    };

    function assignGuestMeshu() {
        var xhr = getMeshuXHR();

        // if we've made one already, set the id
        if ($(meshuID).length)
            xhr.id = self.getMeshuID();

        // assign this guest meshu to the current logged in user
        $.post('/make/assign/', xhr, function(data) {
            // create new meshu_id element in the form
            updateMeshuID(data.meshu_id);

            if (self.postAssignCallback) {
              self.postAssignCallback(data);
            }

        }, 'json');
    };

    function createNewMeshu() {
        var xhr = getMeshuXHR();

        // if we've made one already, set the id
        if ($(meshuID).length)
            xhr.id = self.getMeshuID();

        // push this
        $.post('/make/create/', xhr, function(data) {
            // create new meshu_id element in the form
            updateMeshuID(data.meshu_id);

            if (self.postCreateCallback) {
              self.postCreateCallback(data);
            }

        }, 'json');
    }

    self.initialize = function(meshu) {
        self.meshu = meshu;

        $("#cancel-button").click(function() {
          window.location.href = loadedMeshu.view_url;
        });

        // this only applies to usermade meshus
        var saveButton = "#save-button";
        $(saveButton).click(function() {
          if (!loadedMeshu) return;

          $(saveButton).html('saving');

          var saveurl = loadedMeshu.edit_url + 'save';
          $.post(saveurl, getMeshuXHR(), function(data) {

              // create new meshu_id element in the form
              updateMeshuID(data.meshu_id);

              setTimeout(function() {
                $(saveButton).html('saved!');
              }, 200);

              setTimeout(function() {
                window.location.href = data.meshu_url;
              }, 1000);
            }, 'json');
        });

        // update this meshu
        var updateButton = "#update-button";
        $(updateButton).click(function() {
          if (!loadedMeshu) return;

          $(updateButton).html('updating');

          var updateurl = loadedMeshu.edit_url + 'update';
          $.post(updateurl, getMeshuXHR(), function(data) {

              // create new meshu_id element in the form
              updateMeshuID(data.meshu_id);

              setTimeout(function() {
                $(updateButton).html('saved!');
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

    self.createOrUpdateMeshu = function(callback) {
        // protect the saving so we don't save readymades
        if (self.meshu.isReadymade && callback) {
            callback();
        } else if (self.meshu.username && self.meshu.username == 'guest') {
            assignGuestMeshu();

            if (callback) {
              self.postAssignCallback = callback;
            }
        } else {
            createNewMeshu();

            if (callback) {
              self.postCreateCallback = callback;
            }
        }

        return self;
    };

    self.updateMeshuData = function(data) {
        updateMeshuID(data.id);

        self.meshu.view_url = data.view_url;
        self.meshu.username = data.username;
        self.meshu.title = data.title;
        self.meshu.promo = data.promo;

        if (data.image_url)
          self.meshu.image_url = data.image_url;
    };

    self.getMeshuID = function() {
        return $(meshuID).val();
    };

    return self;
}();