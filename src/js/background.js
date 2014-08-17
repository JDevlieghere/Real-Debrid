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
var rd = new RealDebrid(75, 7);

$(document).ready(function() {
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
    chrome.runtime.onInstalled.addListener(is.installHandler);

    // Check Account
    rd.checkAccount();
});

/* RealDebrid */
function RealDebrid(warningPercentage, warningDays) {

    this.warnings = [];
    this.warningPercentage = warningPercentage;
    this.warningDays = warningDays;

    var that = this;

    chrome.storage.local.get({
        warnings: []
    }, function(result) {
        that.warnings = result.warnings;
    });

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
        if (used >= that.warningPercentage && index === -1) {
            nf.progress(hoster.name, "You have used " + used + "% of the available traffic.", used);
            that.storeWarning(hoster.name);
        } else if (used < that.percentage && index !== -1) {
            that.removeWarning(index, 1);
        }
    };

    this.checkPremium = function(data) {
        var key = 'premium-left';
        var daysLeft = Math.round(data[key] / (-1 * 24 * 60 * 60));
        var index = that.warnings.indexOf(key);
        if (daysLeft <= that.warningDays && index === -1) {
            nf.info("You have only " + daysLeft + " days left of premium.");
            that.storeWarning(key);
        } else if (daysLeft > that.warningDays && index !== -1) {
            that.removeWarning(key);
        }
    };

    this.checkAccount = function() {
        that.account(function(result) {
            if (!result.error) {
                that.checkPremium(result);
                $.each(result.limited, function(index, hoster) {
                    that.checkHoster(hoster);
                });
            }
        });
    };

    this.storeWarning = function(warning) {
        that.warnings.push(warning);
        chrome.storage.local.set({
            warnings: that.warnings
        }, function() {});
    };

    this.removeWarning = function(warning) {
        var index = that.warnings.indexOf(warning);
        that.warnings.splice(index, 1);
        chrome.storage.local.set({
            warnings: that.warnings
        }, function() {});
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
        };
        chrome.notifications.create("id_" + id, options, function(notificationId) {
            if (onClicked) {
                that.callbacks[notificationId] = onClicked;
            }
        });
    };

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

    this.onInstall = function(currVersion) {
        nf.info("Extension installed");
    };

    this.onUpdate = function(prevVersion, currVersion) {
        var prevVersionDigits = prevVersion.split('.');
        var currVersionDigits = currVersion.split('.');
        if (prevVersionDigits.length >= 2 && currVersionDigits.length >= 2 && prevVersionDigits[0] == currVersionDigits[0] && prevVersionDigits[1] == currVersionDigits[1]) {
            console.log("Extension updated (bugfix) to version " + currVersion);
        } else {
            var message = "Extension updated to version " + currVersion + ". Click here to see all changes.";
            nf.info(message, function() {
                chrome.tabs.create({
                    url: 'https://github.com/JDevlieghere/Real-Debrid/blob/master/CHANGELOG.md'
                }, function() {});
            });
        }
    };

    this.installHandler = function(details) {
        var currVersion = chrome.runtime.getManifest().version;
        if (details.reason == "install") {
            that.onInstall(currVersion);
        } else if (details.reason == "update") {
            that.onUpdate(details.previousVersion, currVersion);
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
            nf.info("All downloads complete");
        }
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
                that.removeFromActive(downloadItemDelta.id);
                that.checkComplete();
            } else if (downloadItemDelta.state.current == "interrupted") {
                that.removeFromActive(downloadItemDelta.id);
            }
            rd.checkAccount();
        }
    };
}
