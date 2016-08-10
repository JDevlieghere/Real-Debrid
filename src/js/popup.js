var pageIdentifier = "popup";

$("#options").click(function() {
    var optionsUrl = chrome.extension.getURL("html/options.html");
    chrome.tabs.query({
        url: optionsUrl
    }, function(tabs) {
        chrome.tabs.create({
            url: optionsUrl
        });
        window.close();
    });
});

$(".downloadPage").click(function() {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.runtime.sendMessage({
            url: tab.url
        }, function() {});
        window.close();
    });
});

$(".unrestrictUrl").click(function() {
    var unrestrictUrl = $("input#unrestrictUrl").val();
    var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
    if (unrestrictUrl.match(regex)) {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.runtime.sendMessage({
                url: unrestrictUrl
            }, function() {});
            window.close();
        });
    } else {
        $('#unrestrictUrl').parent().addClass("is-invalid");
    }
});

var load = function() {
    getDownloads();
};

$(document).ready(load);
