$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        chrome.tabs.create({
            url: 'html/options.html' + this.hash
        }, function() {
            window.close();
        });
    });
});

$("a#download").click(function() {
    chrome.tabs.getSelected(null, function(tab) {
        chrome.runtime.sendMessage({
            url: tab.url
        }, function() {});
        window.close();
    });
});
