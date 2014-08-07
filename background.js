$(document).ready(function() {
	chrome.contextMenus.create({
		"title": "Download with Real-Debrid",
		"contexts": ["link"],
		"onclick" : unrestrict
	});
});

function auth(user, pass){
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
			success: function(result){
				if(result.error){
					alert("Invalid credentials.");
				}
			},
			error: function () {
			    alert("Something went wrong...");
			}
	    }
	);
}

function unrestrict(info) {
	var downloadUrl = info.linkUrl;
	var apiUrl = 'https://real-debrid.com/ajax/unrestrict.php?link=' + downloadUrl;
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
			success: function(result){
				console.log(result)
			},
			error: function (xhr) {
			    alert("Something went wrong...");
			}
	    }
	);
}


