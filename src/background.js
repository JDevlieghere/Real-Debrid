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

var is = new Installer();
var dm = new DownloadManager();
var nf = new Notifier();
var rd = new RealDebrid();

$(document).ready(function() {
	is.run();
	chrome.contextMenus.create({
		"title": "Download with Real-Debrid",
		"contexts": ["link", "selection"],
		"onclick" : function(info){
			if(typeof info.selectionText !== "undefined"){
				rd.selectionHandler(info.selectionText);
			}else if(typeof info.linkUrl !== "undefined"){
				rd.urlHandler(info.linkUrl);
			}
		}
	});
	chrome.downloads.onChanged.addListener(dm.changeHandler);
});

function RealDebrid(){

	var that = this;

	this.selectionHandler = function(selection){
		var urls = selection.split(" ");
		var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
		$.each(urls, function(index, url){
			if(url.match(regex)){
				that.urlHandler(url);
			}
		});
	}

	this.urlHandler = function(url){
		that.unrestrict(url, function(result){
			if(!result.error){
				that.download(result);
			}else if(result.error == 1){
				nf.basic("Real-Debrid", "Please login on real-debrid.com");
			}else{
				nf.basic(result.message, url);
			}
		});
	}

	this.download = function(data){
		var downloadUrl = data.generated_links[0][2];
		dm.download(downloadUrl);
	}

	this.unrestrict = function(url, callback) {
		var apiUrl = 'https://real-debrid.com/ajax/unrestrict.php?link=' + url;
		$.ajax({
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
				nf.basic("Real-Debrid","Could not reach real-debrid.com");
			}
		});
	}
}

/* Notifier */
function Notifier(){

	var notificationId = 0;

	this.basic = function(title, text){
		var id = ++notificationId;
		var options = {
			iconUrl: "/icons/icon-128.png",
			type : "basic",
			title: title,
			message: text,
			priority: 1
		};
		chrome.notifications.create("id_"+id, options, function(){});
	}
}


/* Installer */
function Installer(){

	var that = this;

	this.onInstall = function(){
		nf.basic("Real-Debrid", "Extension installed");
	}

	this.onUpdate = function(){
		nf.basic("Real-Debrid", "Extension updated to version " + that.getVersion());
	}

	this.getVersion = function(){
		var details = chrome.app.getDetails();
		return details.version;
	}

	this.run = function(){
		var currVersion = that.getVersion();
		var prevVersion = localStorage['version'];
		if (currVersion != prevVersion) {
			if (typeof prevVersion == 'undefined') {
			  that.onInstall();
			} else {
			  that.onUpdate();
			}
			localStorage['version'] = currVersion;
		}
	}
}

/* Download Manager */
function DownloadManager(){

	var active 	= [];
	var that = this;

	this.download = function(url){
		chrome.downloads.download({url: url}, function(downloadId){
			active.push(downloadId);
		});
	}

	this.checkComplete = function(){
		if(active.length == 0){
			nf.basic("Real-Debrid", "All download complete");
		}
	}

	this.changeHandler = function(downloadItemDelta){
		var index = active.indexOf(downloadItemDelta.id);
		if(index > -1 && typeof downloadItemDelta.state !== "undefined" && downloadItemDelta.state.current == "complete"){
			active.splice(index, 1);
			that.checkComplete();
		}
	}
}