$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
		var optionsUrl = chrome.extension.getURL('html/options.html');
		var fullUrl = optionsUrl + this.hash;
		chrome.tabs.query({url: optionsUrl}, function(tabs) {
		    if (tabs.length) {
		        chrome.tabs.update(tabs[0].id, {active: true, url: fullUrl});
		    } else {
		        chrome.tabs.create({url: fullUrl });
		    }
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
