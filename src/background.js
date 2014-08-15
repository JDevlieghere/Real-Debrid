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
    // Run Installer
    is.run();

    // Add to Context Menu
    chrome.contextMenus.create({
        "title": "Download with Real-Debrid",
        "contexts": ["page", "link", "selection"],
        "onclick": function(info) {
            if (typeof info.selectionText !== "undefined") {
                rd.selectionHandler(info.selectionText);
            } else if (typeof info.linkUrl !== "undefined") {
                rd.urlHandler(info.linkUrl);
            } else {
                rd.urlHandler(info.pageUrl);
            }
        }
    });

    // Register Handlers
    chrome.downloads.onChanged.addListener(dm.changeHandler);
    chrome.notifications.onClicked.addListener(nf.clickHandler);

});

/* RealDebrid */
function RealDebrid() {

    this.warnings = [];
    this.warningPercentage = 10;

    var that = this;

    this.selectionHandler = function(selection) {
        var urls = selection.split(" ");
        var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
        $.each(urls, function(index, url) {
            if (url.match(regex)) {
                that.urlHandler(url);
            }
        });
    };

    this.urlHandler = function(url) {
        that.unrestrict(url, function(result) {
            if (!result.error) {
                that.download(result);
            } else if (result.error == 1) {
                nf.error("Please make sure you are logged in. Click here to go to real-debrid.com", function() {
                    chrome.tabs.create({
                        url: 'https://real-debrid.com'
                    }, function() {});
                });
            } else {
                nf.basic(result.message, url);
            }
        });
    };

    this.download = function(data) {
        var downloadUrl = data.generated_links[0][2];
        console.log(downloadUrl);
        dm.download(downloadUrl);
    };

    this.api = function(url, callback) {
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'json',
            data: {},
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: callback,
            error: function() {
                nf.error("Could not reach real-debrid.com");
            }
        });
    };

    this.unrestrict = function(url, callback) {
        var apiUrl = 'https://real-debrid.com/ajax/unrestrict.php?link=' + url;
        that.api(apiUrl, callback);
    };

    this.account = function(callback) {
        var apiUrl = 'https://real-debrid.com/api/account.php?out=json';
        that.api(apiUrl, callback);
    };


    this.checkHoster = function(hoster) {
        var index = that.warnings.indexOf(hoster.name);
        var total = hoster.limit + hoster.additional_traffic;
        var used = (hoster.downloaded / total) * 100;
        if (used > that.warningPercentage && index === -1) {
            nf.progress(hoster.name, "You have used " + used + "% of the available traffic.", used);
            that.warnings.push(hoster.name); 
        } else if (used < that.percentage && index !== -1) {
            that.warnings.splice(index, 1);
        }
    };

    this.checkLimits = function() {
        that.account(function(data) {
            $.each(data.limited, function(index, hoster) {
                that.checkHoster(hoster);
            });
        });
    };
}

/* Notifier */
function Notifier() {

    this.notificationId = 0;
    this.callbacks = {};

    var that = this;

    this.basic = function(title, text, onClicked) {
        var id = ++that.notificationId;
        var options = {
            iconUrl: "/icons/icon-128.png",
            type: "basic",
            title: title,
            message: text,
            priority: 1
        };
        chrome.notifications.create("id_" + id, options, function(notificationId) {
            if (onClicked) {
                that.callbacks[notificationId] = onClicked;
            }
        });
    };

    this.progress = function(title, text, progress, onClicked) {
        var id = ++that.notificationId;
        var options = {
            iconUrl: "/icons/icon-128.png",
            type: "progress",
            title: title,
            message: text,
            priority: 1,
            progress: progress
        }
        chrome.notifications.create("id_" + id, options, function(notificationId) {
            if (onClicked) {
                that.callbacks[notificationId] = onClicked;
            }
        });
    }

    this.error = function(text, callback) {
        that.basic("Error", text, callback);
    };

    this.info = function(text, callback) {
        that.basic("Real-Debrid", text, callback);
    };

    this.clickHandler = function(notificationId) {
        if (that.callbacks[notificationId]) {
            that.callbacks[notificationId]();
            delete that.callbacks[notificationId];
        }
    };
}

/* Installer */
function Installer() {

    var that = this;

    this.onInstall = function() {
        nf.info("Extension installed");
    };

    this.onUpdate = function() {
        var message = "Extension updated to version " + that.getVersion() + ". Click here to see all changes.";
        nf.info(message, function() {
            chrome.tabs.create({
                url: 'https://github.com/JDevlieghere/Real-Debrid/blob/master/CHANGELOG.md'
            }, function() {});
        });
    };

    this.getVersion = function() {
        var details = chrome.app.getDetails();
        return details.version;
    };

    this.run = function() {
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
    };
}

/* Download Manager */
function DownloadManager() {

    this.active = [];
    var that = this;

    this.download = function(url) {
        chrome.downloads.download({
            url: url
        }, function(downloadId) {
            that.addToActive(downloadId);
        });
    };

    this.checkComplete = function() {
        if (that.active.length === 0) {
            nf.info("All download complete");
        }
    };

    this.addToQueue = function(id) {
        queue.push(id)
    };

    this.addToActive = function(id) {
        that.active.push(id);
    };

    this.removeFromActive = function(id) {
        var index = that.active.indexOf(id);
        that.active.splice(index, 1);
    };

    this.changeHandler = function(downloadItemDelta) {
        if (that.active.indexOf(downloadItemDelta.id) > -1 && downloadItemDelta.state) {
            if (downloadItemDelta.state.current == "complete") {
                that.checkComplete();
                that.removeFromActive(downloadItemDelta.id);
            } else if (downloadItemDelta.state.current == "interrupted") {
                that.removeFromActive(downloadItemDelta.id);
            }
            rd.checkLimits();
        }
    };
}
