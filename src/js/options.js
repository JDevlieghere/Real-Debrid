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
});

$("button#save").click(function() {
    var warningPercentage = $("input#warningPercentage").val();
    chrome.storage.sync.set({
        'warningPercentage': warningPercentage
    });

    var warningDays = $("input#warningDays").val();
    chrome.storage.sync.set({
        'warningDays': warningDays
    });

    success();
});

function success() {
    var header = $('div#contentarea div.header');
    header.addClass("success-animation");
    header.on('webkitAnimationEnd', function() {
        header.removeClass("success-animation");
    });
}
