
$(document).ready(function() {

	chrome.storage.sync.get('user', function (result) {
		var user = result.user;
		chrome.storage.sync.get('pass', function (result) {
			var pass = result.pass;
			auth(user, pass, function(result){
				console.log(result);
			});
		});
	});

	chrome.contextMenus.create({
		"title": "Download using Real-Debrid",
		"contexts": ["link", "selection"],
		"onclick" : contextClickHandler
	});
});

function contextClickHandler(info){
	if(info.selectedText !== ""){
		selectionHandler(info.selectionText);
	}else if(info.linkUrl !== ""){
		urlHandler(info.linkUrl);
	}else{
		console.log('Not supposed to happen')
	}
}

function selectionHandler(selection){
	// TODO: Split multiple URLS
	// TODO: Check for valid URL
	urlHandler(selection);
}

function urlHandler(url){
	unrestrict(url, function(result){
		if(!result.error){
			download(result);
		}else{
			console.log(result);
		}
	});
}

function download(data){
	var downloadUrl = data.generated_links[0][2];
	if(downloadUrl){
		window.open(downloadUrl);
	}
}

function auth(user, pass, callback){
	var apiUrl = 'https://real-debrid.com/ajax/login.php?user=' + user + '&pass=' + pass;
	$.ajax(
		{
			type: "GET",
			url: apiUrl,
			dataType: 'json',
			data: {},
			crossDomain: true,
			xhrFields: {
				withCredentials: true
			},
			success: callback,
			error: function () {
				alert("Something went wrong...");
			}
		}
	);
}

function unrestrict(url, callback) {
	var apiUrl = 'https://real-debrid.com/ajax/unrestrict.php?link=' + url;
	$.ajax(
		{
			type: "GET",
			url: apiUrl,
			dataType: 'json',
			data: {},
			crossDomain: true,
			xhrFields: {
				withCredentials: true
			},
			success: callback,
			error: function (xhr) {
				alert("Something went wrong...");
			}
		}
	);
}