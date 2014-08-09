/*
Copyright 2014 Jonas Devlieghere

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var notificationID = 0;

$(document).ready(function() {
	checkInstall();
	chrome.contextMenus.create({
		"title": "Download with Real-Debrid",
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
		}else if(result.error == 1){
			notify("Real-Debrid", "Please login on real-debrid.com");
		}else{
			notify(result.message, url);
		}
	});
}

function download(data){
	var downloadUrl = data.generated_links[0][2];
	if(downloadUrl){
		chrome.tabs.create({
			url: downloadUrl,
			active: false
		});
	}
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
	notify("Real Debrid", "Extension installed");
}

function onUpdate() {
	notify("Real Debrid", "Extension updated to version " + getVersion());
}

function getVersion() {
	var details = chrome.app.getDetails();
	return details.version;
}

function checkInstall(){
	var currVersion = getVersion();
	var prevVersion = localStorage['version'];
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
		iconUrl: "/icons/icon-128.png",
		type : "basic",
		title: title,
		message: text,
		priority: 1
	};
	chrome.notifications.create("id"+id, options, function(){});
}
