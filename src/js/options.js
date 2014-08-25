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
    getAccount();
});

$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[id=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('#contentarea').scrollTo(target, {
                    duration: 'slow'
                });
                return false;
            }
        }
    });
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

function api(url, callback) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        data: {},
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: callback,
        error: function() {
            console.log("Could not reach real-debrid.com");
        }
    });
}

function loginRequired() {
    $('section.login-required').html('You have to be logged in to use this feature.');
}

function getAccount() {
    var url = "https://real-debrid.com/api/account.php?out=json";
    api(url, function(data) {
        if (data.error) {
            loginRequired();
        } else {
            $('#username').html(data.username);
            $('#email').html(data.email);
            $('#points').html(data.points);
            $('#expiration').html(data['expiration-txt']);
            var html = '';
            var limited = data.limited;
            for (var i = 0; i < limited.length; i++) {
                var hoster = limited[i];
                var total = parseFloat(hoster.limit) + parseFloat(hoster.additional_traffic);
                var used = Math.round((parseFloat(hoster.downloaded) / total) * 100);
                html += '<div class="row">';
                html += '<div class="key"><img src="' + hoster.image + '" class="emblem" //> ' + hoster.name + '</div>';
                html += '<div class="value">';
                html += '<div class="progress">';
                html += '<div class="progress-bar" role="progressbar" aria-valuenow="' + used + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + used + '%;">';
                html += used + '%';
                html += '</div>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
            }
            $('#hosters').append(html);
        }

    });

}

function getDownloads() {
    var url = "https://real-debrid.com/api/downloads.php?out=json";
    api(url, function(data) {
        if (data.error) {
            loginRequired();
        } else {
            var downloads = data.downloads;
            var html = '';
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
        }

    });
}
