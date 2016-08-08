var URL_TRAFFIC = "https://api.real-debrid.com/rest/1.0/traffic";
var URL_USER = 'https://api.real-debrid.com/rest/1.0/user';
var URL_TORRENT_HOSTERS = 'https://api.real-debrid.com/rest/1.0/torrents/availableHosts';
var pageIdentifier = 'options';

var load = function() {
    chrome.storage.sync.get({
        'apiKey': ''
    }, function(result) {
        $("input#apiKey").val(result.apiKey).parent().addClass('is-dirty');
    });

    chrome.storage.sync.get({
        'warningPercentage': 75
    }, function(result) {
        $("input#warningPercentage").val(result.warningPercentage).parent().addClass('is-dirty');
    });

    chrome.storage.sync.get({
        'warningDays': 7
    }, function(result) {
        $("input#warningDays").val(result.warningDays).parent().addClass('is-dirty');
    });

    chrome.storage.sync.get({
        'bypassNativeDl': false
    }, function(result) {
        if (result.bypassNativeDl) {
          $('#bypassNativeDlLabel').get(0).MaterialSwitch.on();
        }
    });

    chrome.storage.sync.get({
        'splittingSize': 50
    }, function(result) {
        $("input#splittingSize").val(result.splittingSize).parent().addClass('is-dirty');
    });

    chrome.storage.sync.get({
        'torrentHost': "1fichier.com"
    }, function(result) {
        getTorrentHosters(function(){
            $('label[hoster="' + result.torrentHost + '"]')[0].MaterialRadio.check();
        });
    });

    var version = chrome.runtime.getManifest().version;
    $('#version').html(version);

    // A fix for first time setup
    $('section.login-required').children().show();
    $('section.login-required h6').hide();

    getDownloads();
    // getTraffic();
    getAccount();
};

$(document).ready(load);

$(function() {
    var currentPosition = 0;
    var target = 0;
    var header = 0;
    $('.mdl-layout__content').bind("scroll", function () {
        currentPosition = $('.mdl-layout__content').scrollTop();
    });
    $('.mdl-navigation__link').click(function() {
        header = $(".mdl-layout__header").height();
        target = $("#" + this.id + "Card").offset();
        target = target.top - header - 10 + currentPosition;
        scroll(target);
    });
});

function scroll(target) {
    $('.mdl-layout__content').stop().animate({ scrollTop: target }, "slow");
    return false;
}

$("button#save").click(function() {
    var apiKey = $("input#apiKey").val();
    var warningPercentage = $("input#warningPercentage").val();
    var warningDays = $("input#warningDays").val();
    var bypassNativeDl = $("input#bypassNativeDl").parent().hasClass('is-checked');
    var splittingSize = $("input#splittingSize").val();
    var torrentHost = $("input.torrentHost").parent(".is-checked").attr("hoster"); // TODO: Find a better way to read this

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

function getAccount(callback) {
    api(URL_USER, function(data) {
        var expirationDate = moment(data.expiration).format('D MMMM YYYY, H:mm') + " (" + moment(data.expiration, "YYYYMMDD").fromNow() + ")";
        $('#avatar').html('<img src="' + data.avatar + '">');
        $('#username').html(data.username);
        $('#email').html(data.email);
        $('#points').html(data.points);
        $('#expiration').html(expirationDate);
    });
}

// function getTraffic(callback) {
//     api(URL_TRAFFIC, function(data) {
//         if (data.error) {
//             loginRequired();
//         } else {
//             var html = '';
//             var hosters = Object.keys(data);
//             for (var i = 0; i < hosters.length; i++) {
//                 var hoster = data[hosters[i]];
//                 if (hoster.left && hoster.limit) {
//                     var used = Math.round((1 - (parseFloat(hoster.left) / parseFloat(hoster.limit))) * 100);
//                     html += '<div class="row">';
//                     html += '<div class="key">' + hosters[i] + '</div>';
//                     html += '<div class="value">';
//                     html += '<div class="progress">';
//                     html += '<div class="progress-bar" role="progressbar" aria-valuenow="' + used + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + used + '%;">';
//                     html += used + '%';
//                     html += '</div>';
//                     html += '</div>';
//                     html += '</div>';
//                     html += '</div>';
//                 }
//             }
//             $('#hosters').append(html);
//             callback();
//         }
//     });
// }

function getTorrentHosters(callback) {
    api(URL_TORRENT_HOSTERS, function(data) {
        var html = "", // preventing 'undefined' error
            hoster;
        for(var i = 0; i < data.length; i++) {
            hoster = data[i].host.substring(0, data[i].host.indexOf('.'));
            html += `
                    <label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="` + hoster + `" hoster="` + data[i].host + `">
                        <input type="radio" class="torrentHost mdl-radio__button" name="hoster" id="` + hoster + `">
                        <span class="mdl-radio__label">` + data[i].host + `</span>
                    </label>
                    <div class="mdl-layout-spacer spacer"></div>
                    `;
        }
        $('.mdl-card #torrentHosters').html(html);
        componentHandler.upgradeAllRegistered(); // Required by MDL
        callback();
    });
}
