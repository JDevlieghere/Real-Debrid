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

var URL_CHANGELOG = 'https://github.com/JDevlieghere/Real-Debrid/blob/master/CHANGELOG.md';
var URL_MAGNET = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';
var URL_TOKEN = 'https://real-debrid.com/apitoken';
var URL_TRAFFIC = 'https://api.real-debrid.com/rest/1.0/traffic';
var URL_UNRESTRICT = 'https://api.real-debrid.com/rest/1.0/unrestrict/link';
var URL_UNRESTRICT_FOLDER = 'https://api.real-debrid.com/rest/1.0/unrestrict/folder';
var URL_USER = 'https://api.real-debrid.com/rest/1.0/user';

var is = new Installer();
var nf = new Notifier();
var op = new Options();

var rd;
var dm;

// Register Options Handler
op.addListener(function() {
    rd = new RealDebrid(op.values.warningPercentage,
        op.values.warningDays,
        op.values.splittingSize,
        op.values.torrentHost);
    dm = new DownloadManager(op.values.bypassNativeDl);
    chrome.downloads.onChanged.addListener(dm.changeHandler);
});

// Load Options
op.load();

// Register Chrome Listeners
chrome.runtime.onInstalled.addListener(is.installHandler);
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.url) {
        rd.urlHandler(request.url);
    }
});
chrome.notifications.onClicked.addListener(nf.clickHandler);
chrome.storage.onChanged.addListener(op.changeHandler);

// Create Context Menu
chrome.contextMenus.create({
    "title": "Download with Real-Debrid",
    "contexts": ["link", "selection"],
    "onclick": function(info) {
        if (typeof info.selectionText !== "undefined") {
            rd.selectionHandler(info.selectionText);
        } else if (typeof info.linkUrl !== "undefined") {
            rd.urlHandler(info.linkUrl);
        }
    }
});

function Options() {
    this.values = {};
    this.onLoaded = document.createEvent('Event');

    var that = this;

    this.addListener = function(handler) {
        document.addEventListener('onLoaded', handler, false);
    };

    this.isReady = function() {
        var ready = true;
        for (var key in that.values) {
            ready = ready && that.values[key] !== null;
        }
        return ready;
    };

    this.checkReady = function() {
        if (that.isReady()) {
            document.dispatchEvent(that.onLoaded);
        }
    };

    this.changeHandler = function(changes, namespace) {
        var changed = false;
        for (var key in changes) {
            if (that.values[key]) {
                that.values[key] = changes[key].newValue;
                changed = true;
            }
        }
        if (changed) {
            document.dispatchEvent(that.onLoaded);
        }
    };

    this.init = function() {
        that.onLoaded.initEvent('onLoaded', true, true);
        that.values.warningPercentage = null;
        that.values.warningDays = null;
        that.values.bypassNativeDl = null;
        that.values.splittingSize = null;
        that.values.torrentHost = null;
    };

    this.load = function() {
        that.init();
        chrome.storage.sync.get({
            'warningPercentage': 75
        }, function(result) {
            that.values.warningPercentage = result.warningPercentage;
            that.checkReady();
        });

        chrome.storage.sync.get({
            'warningDays': 7
        }, function(result) {
            that.values.warningDays = result.warningDays;
            that.checkReady();
        });

        chrome.storage.sync.get({
            'bypassNativeDl': false
        }, function(result) {
            that.values.bypassNativeDl = result.bypassNativeDl;
            that.checkReady();
        });

        chrome.storage.sync.get({
            'splittingSize': 50
        }, function(result) {
            that.values.splittingSize = result.splittingSize;
            that.checkReady();
        });

        chrome.storage.sync.get({
            'torrentHost': "utb"
        }, function(result) {
            that.values.torrentHost = result.torrentHost;
            that.checkReady();
        });

    };
}

/* RealDebrid */
function RealDebrid(warningPercentage, warningDays, splittingSize, torrentHost) {

    this.warnings = [];
    this.warningPercentage = warningPercentage;
    this.warningDays = warningDays;
    this.apiKey = null;

    var that = this;

    chrome.storage.sync.get({
        'apiKey': ''
    }, function(result) {
        that.apiKey = result.apiKey;
    });

    chrome.storage.local.get({
        warnings: []
    }, function(result) {
        that.warnings = result.warnings;
        that.checkAccount();
    });

    this.selectionHandler = function(selection) {
        var urls = selection.split(" ");
        var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/);
        var invalid;
        $.each(urls, function(index, url) {
            if (url.match(regex)) {
                that.urlHandler(url);
            } else {
                invalid = 1;
            }
        });
        if (invalid) {
          nf.error("Selected text doesn't seem to contain valid download URL(s)");
        }
    };

    this.urlHandler = function(url) {
        var regex = new RegExp(/(\/folder\/)/ig);
        if (url.lastIndexOf('magnet:', 0) === 0) {
            that.handleMagnet(url, function(result) {
                if (result.uri) {
                    chrome.tabs.create({
                        url: result.uri + "?auth_token=" + that.apiKey
                    });
                } else {
                    nf.error("Error adding magnet");
                }
            });
        } else {
            if (url.match(regex)) {
                that.unrestrictFolder(url, function(result) {
                  $.each(result, function(index, results) {
                    results = results.substring(0, results.indexOf('"')); // RD API seems to return some extra incorrectly formatted information
                    that.urlHandlerExtension(results);
                  });
                });
            } else {
              that.urlHandlerExtension(url);
            }
        }
    };

    this.urlHandlerExtension = function(url) {
        that.unrestrict(url, function(result) {
            if (result.download) {
                that.download(result.download);
            } else {
                nf.error("Error adding download");
            }
        });
    };

    this.download = function(data) {
        dm.download(data);
    };

    this.post = function(url, data, callback) {
        $.ajax({
            type: "POST",
            url: url + "?auth_token=" + that.apiKey,
            dataType: 'json',
            data: data,
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: callback,
            error: function(e) {
                      that.handleError(e.responseText);
                    }
        });
    };

    this.get = function(url, callback) {
        $.ajax({
            type: "GET",
            url: url + "?auth_token=" + that.apiKey,
            dataType: 'json',
            data: {},
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: callback,
            error: function(e) {
                      that.handleError(e.responseText);
                    }
        });
    };

    this.handleError = function(result) {
        var prased_result = $.parseJSON(result);
        switch (prased_result.error_code) {
          case -1:
            nf.error("Real-Debrid internal error");
            break;
          case 8:
          case 9:
            nf.error("Unable to authenticate with Real-Debrid. Please click here to set-up your API key.", nf.openOptions);
            break;
          case 14:
            nf.error("Account locked");
            break;
          case 15:
            nf.error("Account not activated");
            break;
          case 16:
            nf.error("Unsupported hoster");
            break;
          case 17:
            nf.error("Hoster in maintenance");
            break;
          case 18:
            nf.error("Hoster limit reached");
            break;
          case 19:
            nf.error("Hoster temporarily unavailable");
            break;
          case 20:
            nf.error("Hoster not available for free users");
            break;
          case 21:
            nf.error("Too many active downloads");
            break;
          default:
            nf.error("Uh Oh. Real-Debrid API responded with an unknown error. Code #: " + prased_result.error_code);
        }
    };

    this.unrestrict = function(url, callback) {
        that.post(URL_UNRESTRICT, {
            link: url
        }, callback);
    };

    this.unrestrictFolder = function(url, callback) {
        that.post(URL_UNRESTRICT_FOLDER, {
            link: url
        }, callback);
    };

    this.account = function(callback) {
        that.get(URL_USER, callback);
    };

    this.traffic = function(callback) {
        that.get(URL_TRAFFIC, callback);
    };

    this.handleMagnet = function(magnetLink, callback) {
        that.post(URL_MAGNET, {
            magnet: magnetLink,
            split: splittingSize,
            host: torrentHost
        }, callback);
    };

    this.checkPremium = function(data) {
        var today = new Date();
        var expiration = new Date(data.expiration);
        var daysLeft = Math.round(Math.abs((expiration.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));

        var key = 'premium-left';
        var index = that.warnings.indexOf(key);

        if (daysLeft <= that.warningDays && index === -1) {
            nf.info("You have only " + daysLeft + " days left of premium. Click here to change warnings preferences.", nf.openOptions);
            that.storeWarning(key);
        } else if (daysLeft > that.warningDays && index !== -1) {
            that.removeWarning(key);
        }
    };

    this.checkAccount = function() {
        that.account(function(result) {
            that.checkPremium(result);
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

    this.openOptions = function() {
        var optionsUrl = chrome.extension.getURL('html/options.html');
        chrome.tabs.query({
            url: optionsUrl
        }, function(tabs) {
            if (tabs.length) {
                chrome.tabs.update(tabs[0].id, {
                    active: true
                });
            } else {
                chrome.tabs.create({
                    url: optionsUrl
                });
            }
            window.close();
        });
    };
}

/* Installer */
function Installer() {

    var that = this;

    this.onInstall = function(currVersion) {
        chrome.tabs.create({
            url: "html/options.html"
        }, function() {
            nf.info("Extension installed");
        });
    };

    this.onUpdate = function(prevVersion, currVersion) {
        var prevVersionDigits = prevVersion.split('.');
        var currVersionDigits = currVersion.split('.');
        if (prevVersionDigits.length >= 2 &&
            currVersionDigits.length >= 2 &&
            prevVersionDigits[0] == currVersionDigits[0] &&
            prevVersionDigits[1] == currVersionDigits[1]) {
            console.log("Extension updated (bugfix) to version " + currVersion);
        } else {
            var message = "Extension updated to version " + currVersion + ". Click here to see all changes.";
            nf.info(message, function() {
                chrome.tabs.create({
                    url: URL_CHANGELOG
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
function DownloadManager(bypassNativeDl) {

    this.active = [];
    var that = this;

    this.download = function(url) {
        if (!bypassNativeDl) {
            chrome.downloads.download({
                url: url
            }, function(downloadId) {
                that.addToActive(downloadId);
            });
        } else {
            chrome.tabs.create({
                url: url,
                active: false
            });
        }
    };

    this.checkComplete = function() {
        if (that.active.length === 0) {
            nf.info("All downloads complete", nf.openOptions);
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
