function bytesToSize(bytes) { // from http://scratch99.com/web-development/javascript/convert-bytes-to-mb-kb/
	var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	if(bytes === 0) return 'n/a';
	var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
	if(i === 0) return bytes + ' ' + sizes[i];
	return(bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}

function loginRequired() {
	$('section.login-required').children().hide();
	$('section.login-required').append('<h6 class="mdl-color--red-600 mdl-color-text--white"><i class="material-icons">error</i><span>Could not reach Real-Debrid API.</span></h6>');
}

function success() {
	var notification = document.querySelector('.mdl-js-snackbar');
	notification.MaterialSnackbar.showSnackbar({
		message: 'Your options have been saved'
	});
}

function failure() {
	var notification = document.querySelector('.mdl-js-snackbar');
	notification.MaterialSnackbar.showSnackbar({
		message: 'Could not save your options'
	});
}

function getApiKey(callback) {
	chrome.storage.sync.get({
		'apiKey': ''
	}, function(result) {
		callback(result.apiKey);
	});
}

function api(url, callback) {
	getApiKey(function(key) {
		$.ajax({
			type: "GET",
			url: url + "?auth_token=" + key,
			dataType: 'json',
			data: {},
			crossDomain: true,
			xhrFields: {
				withCredentials: true
			},
			success: callback,
			error: function() {
				loginRequired();
			}
		});
	});
}

function getDownloads(callback) { // TODO: Find a way to get all hoster icons
	var url = "https://api.real-debrid.com/rest/1.0/downloads";
	api(url, function(data) {
		var html = '',
			createdDate,
			prettySize,
			mime,
			hoster,
			originalUrl,
			unrestrictedUrl;
		if (pageIdentifier == 'options') {
			originalUrl = 'Original URL';
			unrestrictedUrl = 'Unrestricted';
		} else if (pageIdentifier == 'popup') {
			originalUrl = '<i class="material-icons">file_download</i>';
			unrestrictedUrl = '<i class="material-icons">cloud_download</i>';
		}
		for(var i = 0; i < data.length; i++) {
			createdDate = moment(data[i].generated).format('D MMM YYYY, H:mm');
			prettySize = bytesToSize(data[i].filesize);
			hoster = data[i].host.substring(0, data[i].host.indexOf('.'));

			if (pageIdentifier == 'options') {
				if (!data[i].mimeType) { // Sometimes RD API would return null values
					data[i].mimeType = "";
				}
				switch(data[i].mimeType) {
					case(data[i].mimeType.match(/mp4|matroska|wmv|avi|flv/) || {}).input:
						mime = "video";
						break;
					case(data[i].mimeType.match(/audio|mp3|flac|wav|ogg|aac/) || {}).input:
						mime = "audio";
						break;
					case(data[i].mimeType.match(/jpg|png|gif/) || {}).input:
						mime = "pic";
						break;
					case(data[i].mimeType.match(/zip|rar/) || {}).input:
						mime = "zip";
						break;
					case(data[i].mimeType.match(/pdf/) || {}).input:
						mime = "pdf";
						break;
					default:
						mime = "default";
						break;
				}
			}
			html += `<div class="recentCards mdl-card mdl-shadow--2dp mdl-cell mdl-cell--12-col">`;
			if (pageIdentifier == 'options') {
				html += `
	              <div class="mdl-card__title mdl-color--grey-100 mdl-card--border">
	                <h2 class="mdl-card__title-text"><img src="/icons/mime/` + mime + `.png" title="` + data[i].mimeType + `"></h2>
	              </div>
		  		`;
			}
			html += `
              <div class="mdl-card__supporting-text mdl-color-text--grey-600">
                  <div class="filename"><a>` + data[i].filename + `</a> <small>(` + prettySize + `)</small></div>
                  <small>` + createdDate + `</small>
                  <div class="mdl-layout-spacer spacer"></div>
				  <div class="recentLinks">
	                  <a href="` + data[i].link + `" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" target="_blank">` + originalUrl + `</a>
	                  <a href="` + data[i].download + `" class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" target="_blank">` + unrestrictedUrl + `</a>
				  </div>
			  </div>
              <div class="mdl-card__menu">
                <a href="http://www.` + data[i].host + `" target="_blank">
                  <span>
                    <img src="https://cdn.realdebrid.xtnetwork.fr/0693/images/hosters/` + hoster + `.png" title="` + data[i].host + `">
                  </span>
                </a>
              </div>
            </div>
        	`;
		}
		$('.recentDownloads section').append(html);
	});
}
