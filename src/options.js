$(document).ready(function() {
	chrome.storage.sync.get('user', function (result) {
		$("input#username").val(result.user);
	});
	chrome.storage.sync.get('pass', function (result) {
		$("input#password").val(result.pass);
	});
});

$("button#save").click(function() {
	var user = $("input#username").val();
	chrome.storage.sync.set({'user': user});
	var pass = $("input#password").val();
	chrome.storage.sync.set({'pass': pass});

	$(event.target).text("Saved!");
	$(event.target).css({
		"background-color": "#428bca",
		"color" : "white"

	});

	return false;
});