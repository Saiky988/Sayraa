// ==UserScript==
// @name         Tiện ích YouTube
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  
// @author       Sayra & Gemini
// @match        https://*.youtube.com/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=128&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const injectedCode = function() {
        console.log("[Sayra] Launch");

        function cleanYoutubeJSON(jsonObj) {
            let altered = false;
            if (jsonObj && typeof jsonObj === 'object') {
                if (jsonObj.adPlacements && jsonObj.adPlacements.length > 0) { jsonObj.adPlacements = []; altered = true; }
                if (jsonObj.playerAds && jsonObj.playerAds.length > 0) { jsonObj.playerAds = []; altered = true; }
                if (jsonObj.adSlots && jsonObj.adSlots.length > 0) { jsonObj.adSlots = []; altered = true; }
            }
            return { altered, jsonObj };
        }

        let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;
        try {
            Object.defineProperty(window, 'ytInitialPlayerResponse', {
                get: () => _ytInitialPlayerResponse,
                set: (value) => {
                    if (value && typeof value === 'object') {
                        const result = cleanYoutubeJSON(value);
                        if (result.altered) console.log("[Sayra] Cleared Ads from InitialPlayerResponse");
                        _ytInitialPlayerResponse = result.jsonObj;
                    } else {
                        _ytInitialPlayerResponse = value;
                    }
                },
                configurable: true
            });
        } catch (e) {}

        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const fetchPromise = originalFetch.apply(this, args);
            const url = args[0] instanceof Request ? args[0].url : args[0];

            if (typeof url === 'string' && (url.includes('youtubei/v1/player') || url.includes('youtubei/v1/watch'))) {
                return fetchPromise.then(async responseBefore => {
                    const responseClone = responseBefore.clone();
                    try {
                        let text = await responseClone.text();
                        let obj = JSON.parse(text);
                        const result = cleanYoutubeJSON(obj);
                        
                        if (result.altered) {
                            console.log("[Sayra] Cleaned Ads (Fetch):", url);
                            const responseAfter = new Response(JSON.stringify(result.jsonObj), {
                                status: responseBefore.status,
                                statusText: responseBefore.statusText,
                                headers: responseBefore.headers
                            });
                            
                            return new Proxy(responseAfter, {
                                get(target, prop) {
                                    if (['url', 'ok', 'redirected', 'type'].includes(prop)) return responseBefore[prop];
                                    const value = Reflect.get(target, prop);
                                    return typeof value === 'function' ? value.bind(target) : value;
                                }
                            });
                        }
                    } catch (err) {}
                    return responseBefore;
                });
            }
            return fetchPromise;
        };

        const OriginalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = class extends OriginalXHR {
            open(method, url, ...args) {
                this._reqUrl = typeof url === 'string' ? url : url.toString();
                return super.open(method, url, ...args);
            }
            get responseText() {
                let text = super.responseText;
                if (this._reqUrl && (this._reqUrl.includes('youtubei/v1/player') || this._reqUrl.includes('youtubei/v1/watch'))) {
                    try {
                        let result = cleanYoutubeJSON(JSON.parse(text));
                        if (result.altered) {
                            console.log("[Sayra] Cleaned Ads (XHR):", this._reqUrl);
                            return JSON.stringify(result.jsonObj);
                        }
                    } catch(e) {}
                }
                return text;
            }
            get response() {
                let res = super.response;
                if (typeof res === 'string' && this._reqUrl && (this._reqUrl.includes('youtubei/v1/player') || this._reqUrl.includes('youtubei/v1/watch'))) {
                    try {
                        let result = cleanYoutubeJSON(JSON.parse(res));
                        if (result.altered) return JSON.stringify(result.jsonObj);
                    } catch(e) {}
                }
                return res;
            }
        };
    };

    const script = document.createElement('script');
    script.textContent = '(' + injectedCode.toString() + ')();';
    (document.head || document.documentElement).prepend(script);
    script.remove();

})();
