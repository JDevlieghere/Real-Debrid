var notificationID = 0;

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
	if(typeof info.selectionText !== "undefined"){
		selectionHandler(info.selectionText);
	}else if(typeof info.linkUrl !== "undefined"){
		urlHandler(info.linkUrl);
	}
}

function selectionHandler(selection){
	var urls = selection.split(" ");
	var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
	$.each(urls, function(index, url){
		if(url.match(regex)){
			urlHandler(url);
		}
	});
}

function urlHandler(url){
	unrestrict(url, function(result){
		if(!result.error){
			download(result);
		}else{
			notify(result.message, url);
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
				notify("Real Debrid","Login failed. Wrong credentials?");
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
				notify("Real Debrid","Could not reach real-debrid.com");
			}
		}
	);
}

function onInstall() {
	chrome.tabs.create({url: "/src/options.html"});
}

function onUpdate() {
	notify("Real Debrid", "Extension updated!");
}

function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

function checkInstall(){
	if (currVersion != prevVersion) {
		if (typeof prevVersion == 'undefined') {
		  onInstall();
		} else {
		  onUpdate();
		}
		localStorage['version'] = currVersion;
	}
}

function notify(title, text){
	var id = ++notificationID;
	var options = {
		iconUrl: "/icons/icon-256.png",
		type : "basic",
		title: title,
		message: text,
		priority: 1
	};
	chrome.notifications.create("id"+id, options, function(){});
}