;(function () {
    var logPlugin = {
        "api": "system.log",
        "debug": function (data) {
            window.DhBridge.invokeNative({ 'className': this.api, method: 'debug', args: data });
        },
        "error": function (data) {
            window.DhBridge.invokeNative({ 'className': this.api, method: 'error', args: data });
        }
    };
    if (window.DhBridge) {
        if (window.DhBridge["system"]) {
            window.DhBridge["system"]["log"] = logPlugin;
        } else {
            window.DhBridge["system"] = {
                log: logPlugin
            };
        }
    }
})();
