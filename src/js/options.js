$(document).ready(function() {
    chrome.storage.sync.get('warningPercentage', function(result) {
        $("input#warningPercentage").val(result.warningPercentage);
    });

    chrome.storage.sync.get('warningDays', function(result) {
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

    alert("Options saved!");
});
