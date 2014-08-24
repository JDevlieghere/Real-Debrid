$(document).ready(function() {
    chrome.storage.sync.get({
        'warningPercentage': 75
    }, function(result) {
        $("input#warningPercentage").val(result.warningPercentage);
    });

    chrome.storage.sync.get({
        'warningDays': 7
    }, function(result) {
        $("input#warningDays").val(result.warningDays);
    });

    var version = chrome.runtime.getManifest().version;
    $('#version').html(version);

    getDownloads();
});

$("button#save").click(function() {
    var warningPercentage = $("input#warningPercentage").val();
    var warningDays = $("input#warningDays").val();

    if (warningDays && warningPercentage) {
        chrome.storage.sync.set({
            'warningPercentage': warningPercentage
        });

        chrome.storage.sync.set({
            'warningDays': warningDays
        });
        success();
    } else {
        failure();
    }
});

function success() {
    var header = $('div#contentarea div.header');
    header.addClass("success-animation");
    header.on('webkitAnimationEnd', function() {
        header.removeClass("success-animation");
    });
}

function failure() {
    var header = $('div#contentarea div.header');
    header.addClass("failure-animation");
    header.on('webkitAnimationEnd', function() {
        header.removeClass("failure-animation");
    });
}

function getDownloads() {
    var url = "https://real-debrid.com/api/downloads.php?out=json";
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        data: {},
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            var downloads = data.downloads;
            var html = "";
            for (var i = 0; i < downloads.length; i++) {
                html += '<tr>';
                html += '<td><img src="' + downloads[i].hoster_image + '" //></td>';
                html += '<td>' + downloads[i].name + '</td>';
                html += '<td>' + downloads[i].generated_date + '</td>';
                html += '<td><a href="' + downloads[i].original + '" target="_blank">Link</a></td>';
                html += '<td><a href="' + downloads[i].link + '" target="_blank">Link</a></td>';
                html += '</tr>';
            }
            $('#downloads tbody').append(html);
        },
        error: function() {
            console.log("Could not reach real-debrid.com");
        }
    });
}
