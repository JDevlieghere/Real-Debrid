var URL_TRAFFIC = "https://api.real-debrid.com/rest/1.0/traffic";
var URL_USER = 'https://api.real-debrid.com/rest/1.0/user';

var load = function() {
    chrome.storage.sync.get({
        'apiKey': ''
    }, function(result) {
        $("input#apiKey").val(result.apiKey);
    });

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

    chrome.storage.sync.get({
        'bypassNativeDl': false
    }, function(result) {
        $("input#bypassNativeDl").attr('checked', result.bypassNativeDl);
    });

    chrome.storage.sync.get({
        'splittingSize': 50
    }, function(result) {
        $("input#splittingSize").val(result.splittingSize);
    });

    chrome.storage.sync.get({
        'torrentHost': "utb"
    }, function(result) {
        $("select#torrentHost").val(result.torrentHost);
    });

    var version = chrome.runtime.getManifest().version;
    $('#version').html(version);

    getDownloads(function() {
        var target = window.location.hash.substr(1);
        scroll(target);
    });

    getTraffic(function() {
        var target = window.location.hash.substr(1);
        scroll(target);
    });

    getAccount(function() {
        var target = $('#' + window.location.hash.substr(1));
        scroll(target);
    });

};

$(document).ready(load);

$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[id=' + this.hash.slice(1) + ']');
            scroll(target);
        }
    });
});

function scroll(target) {
    if (target.length) {
        $('#contentarea').scrollTo(target, {
            duration: 'slow'
        });
        return false;
    }
}

$("button#save").click(function() {
    var apiKey = $("input#apiKey").val();
    var warningPercentage = $("input#warningPercentage").val();
    var warningDays = $("input#warningDays").val();
    var bypassNativeDl = $("input#bypassNativeDl").is(':checked');
    var splittingSize = $("input#splittingSize").val();
    var torrentHost = $("select#torrentHost").val();

    chrome.storage.sync.set({
        'apiKey': apiKey
    });

    if (warningDays && warningPercentage) {
        chrome.storage.sync.set({
            'warningPercentage': warningPercentage
        });

        chrome.storage.sync.set({
            'warningDays': warningDays
        });

        chrome.storage.sync.set({
            'bypassNativeDl': bypassNativeDl
        });

        chrome.storage.sync.set({
            'splittingSize': splittingSize
        });

        chrome.storage.sync.set({
            'torrentHost': torrentHost
        });

        success();
        load();
    } else {
        failure();
    }
});


function displayMessage(cls, message) {
    var messageContainer = $('#message-container');
    messageContainer.addClass(cls);
    messageContainer.html(message);
    messageContainer.animate({
        top: "+=75px",
        opacity: 1
    }, 200, function() {
        setTimeout(function() {
            messageContainer.animate({
                top: "-=75px",
                opacity: 1
            }, 200, function() {
                messageContainer.removeClass(cls);
            });
        }, 750);
    });
}


function success() {
    displayMessage('success', "Your options have been saved!");
}

function failure() {
    displayMessage('failure', "Could not save your options.");
}

function getApiKey(callback) {
    chrome.storage.sync.get({
        'apiKey': ''
    }, function(result) {
        callback(result.apiKey);
    });
}

function api(url, callback) {
    getApiKey(function(key) {
        $.ajax({
            type: "GET",
            url: url + "?auth_token=" + key,
            dataType: 'json',
            data: {},
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: callback,
            error: function() {
                console.log("Could not reach Real-Debrid API.");
            }
        });
    });
}

function loginRequired() {
    $('section.login-required.accountInfo').html('You have to be logged in to use this feature.');
}

function downloadListDisabled() {
    $('section.login-required.latestDownloads').html('Your download list is disabled.');
}

function getAccount(callback) {
    api(URL_USER, function(data) {
        if (data.error) {
            loginRequired();
        } else {
            $('#username').html(data.username);
            $('#email').html(data.email);
            $('#points').html(data.points);
            $('#expiration').html(data.expiration);
            callback();
        }
    });
}

function getTraffic(callback) {
    api(URL_TRAFFIC, function(data) {
        if (data.error) {
            loginRequired();
        } else {
            var html = '';
            var hosters = Object.keys(data);
            for (var i = 0; i < hosters.length; i++) {
                var hoster = data[hosters[i]];
                if (hoster.left && hoster.limit) {
                    var used = Math.round((1 - (parseFloat(hoster.left) / parseFloat(hoster.limit))) * 100);
                    html += '<div class="row">';
                    html += '<div class="key">' + hosters[i] + '</div>';
                    html += '<div class="value">';
                    html += '<div class="progress">';
                    html += '<div class="progress-bar" role="progressbar" aria-valuenow="' + used + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + used + '%;">';
                    html += used + '%';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                }
            }
            $('#hosters').append(html);
            callback();
        }
    });
}

function getDownloads(callback) {
    var url = "https://api.real-debrid.com/rest/1.0/downloads";
    api(url, function(data) {
        if (data.error) {
            downloadListDisabled();
        } else {
            var html = '';
            for (var i = 0; i < data.length; i++) {
                html += '<tr>';
                html += '<td>' + data[i].host + '</td>';
                html += '<td>' + data[i].filename + '</td>';
                html += '<td>' + data[i].generated + '</td>';
                html += '<td><a href="' + data[i].link + '" target="_blank">Link</a></td>';
                html += '</tr>';
            }
            $('#downloads tbody').append(html);
            callback();
        }

    });
}
