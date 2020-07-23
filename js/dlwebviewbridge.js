;(function(){
    if(window.DLBridge){
        return;
    }
    var DLBRIDGE_SCHEME = 'https';
    var DLBRIDGE_SCHEME_HOST = '__DLb_queue_message__';
    var messagingIframe;
    messagingIframe = document.createElement('iframe');
    messagingIframe.style.display = 'none';
    messagingIframe.src = DLBRIDGE_SCHEME + '://' + DLBRIDGE_SCHEME_HOST;
    document.documentElement.appendChild(messagingIframe);
    window.DLBridge = {
        callHandler:_callHandler,
        callPlugin:_callPlugin,
        handleMessage:_handleMessage,
        fetchMessageQueue:_fetchMessageQueue,
        callBackQueue:{},
        messageQueue:[],

        registerHandlerMap:{},
        registerHandler:_registerHandler,
        removeHandler:_removeHandler,
        callJsHandler:_callJsHandler,

        jsToNative:_jsToNative,
        createPlugin:_createPlugin
    };

    function _registerHandler(handlerName,handlerFunc){
        window.DLBridge.registerHandlerMap[handlerName] = handlerFunc;
    }

    function _removeHandler(handlerName){
        window.DLBridge.registerHandlerMap[handlerName] = null;
    }
    function _callJsHandler(handlerName,arg){
        var handlerFunc =  window.DLBridge.registerHandlerMap[handlerName];
        if(handlerFunc){
            var result =  handlerFunc(arg);
            return result;
        }
        return 'Error,not find handlerName:'+handlerName;
    }

    function _jsToNative(message){
        console.log('[_jsToNative] :'+message);
        var result = false;
        try {
            DL_android_Bridge.DLBridge(message);
            result = true;
        } catch (error) {
            console.log('[_jsToNative] error:'+error);
        }
        try {
            window.webkit.messageHandlers.DLBridge.postMessage(message);
            result = true;
        } catch (error) {
            console.log('[_jsToNative] error:'+error);
        }
        if(!result){
            console.log('ScriptMessageHandler not work, try iframe.src method');
            window.DLBridge.messageQueue.push(message);
            messagingIframe.src = DLBRIDGE_SCHEME + '://' + DLBRIDGE_SCHEME_HOST + "/" + new Date().getTime();
            console.log(messagingIframe.src);
            console.log(window.DLBridge.messageQueue);
            result = true;
        }
        return result;
    }
    
    function _callHandler(handlerName,args,success,fail){
        console.log('[_callHandler] '+handlerName+" " +args);
        var message = {handlerName:handlerName,args:args};
        if(success || fail){
            var callbackId = 'DLbridge_callbackId_'+new Date().getTime();
            window.DLBridge.callBackQueue[callbackId] = {success:success,fail:fail};
            message['callbackId'] = callbackId;
            message['version'] = 1
        }
        var result = _jsToNative(JSON.stringify(message));
        if(!result){
            if(fail){
                fail(400,"bad request");
            }
            delete window.DLBridge.callBackQueue[message['callbackId']];
        }
    }

    function invokeNative(message,callback){
        console.log('[invokeNative] '+message);
        var invokeMessage = {}
        var callbackId = 'DLbridge_callbackId_'+new Date().getTime();
        invokeMessage['callbackId'] = callbackId;
        invokeMessage['version'] = 2
        invokeMessage['data'] = message
        window.DLBridge.callBackQueue[callbackId] = callback
        var result = _jsToNative(JSON.stringify(invokeMessage));
        if(!result){
            callback({isSuccess:false,error:'invoke native error'})
            delete window.DLBridge.callBackQueue[callbackId];
        }
    }
    
    function _callPlugin(pluginName,pluginMethod,args,success,fail){
        var handlerName = {pluginName:pluginName,pluginMethod:pluginMethod};
        _callHandler(handlerName,args,success,fail);
    }
    
    function _handleMessage(message){
        console.log('[_handleMessage] '+message);
        var json = JSON.parse(message);
        var callbackId = json['callbackId'];
        var version = json['version'];
        if(callbackId !== undefined){
            var callback = window.DLBridge.callBackQueue[callbackId];
            var data = json['data']
            if(version && version >= 2){
                callback(json)
            }else{
                var code = json['code'];
                if(code === 200){
                    callback.success(data);
                }else{
                    callback.fail(code,data);
                }
            }
            delete window.DLBridge.callBackQueue[callbackId];
        }
    }

    
    function _fetchMessageQueue() {
        var messageQueue = window.DLBridge.messageQueue;
        console.log('_fetchQueue:' + messageQueue);
        window.DLBridge.messageQueue = [];
        return messageQueue;
    }

    
    function  _createPlugin(pluginName,callback){
        var words = pluginName.split('.')
        if(words.length === 2){
            var region = words[0]
            var classname = words[1]
            invokeNative({'className':pluginName,method:'create'},function(response){
                if(response.isSuccess){
                    var pluginob = undefined
                    var region = window.DLBridge[region]
                    if(region){
                        pluginob = region[classname]
                    }
                    callback(pluginob)
                }else{
                    callback()
                }
            })
        }else{
            callback()
        }
    }
    
    setTimeout(_clearCacheCallQueue, 0);
    function _clearCacheCallQueue() {
        if(window.cacheCallQueue === undefined){return;}
        var queue = window.cacheCallQueue;
        delete window.cacheCallQueue;
        for (var i=0; i<queue.length; i++) {
            window.DLBridge.callHandler(queue[i].handleName,queue[i].args,queue[i].success,queue[i].fail);
        }
    }
}
)();
