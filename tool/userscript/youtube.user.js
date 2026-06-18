// ==UserScript==
// @name         Tiện ích YouTube
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  
// @author       Sayra & Gemini
// @match        https://*.youtube.com/*
// @run-at       document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function cleanYoutubeJSON(jsonObj) {
        let altered = false;
        if (jsonObj.adPlacements && jsonObj.adPlacements.length > 0) { jsonObj.adPlacements = []; altered = true; }
        if (jsonObj.playerAds && jsonObj.playerAds.length > 0) { jsonObj.playerAds = []; altered = true; }
        if (jsonObj.adSlots && jsonObj.adSlots.length > 0) { jsonObj.adSlots = []; altered = true; }
        return { altered, jsonObj };
    }

    const originalFetch = self.fetch;
    const OriginalXHR = self.XMLHttpRequest;

    if (isIOS) {
        console.log("[Sayra] Running iOS mode");

        self.fetch = async function(...args) {
            const fetchPromise = Reflect.apply(originalFetch, this, args);
            const url = args[0] instanceof Request ? args[0].url : args[0];

            if (typeof url === 'string' && (url.includes('youtubei/v1/player') || url.includes('youtubei/v1/watch'))) {
                return fetchPromise.then(async responseBefore => {
                    const responseClone = responseBefore.clone();
                    let text = await responseClone.text();
                    try {
                        let obj = JSON.parse(text);
                        const result = cleanYoutubeJSON(obj);
                        if (result.altered) {
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

        self.XMLHttpRequest = class extends OriginalXHR {
            open(method, url, ...args) {
                this._reqUrl = typeof url === 'string' ? url : url.toString();
                return super.open(method, url, ...args);
            }
            get responseText() {
                let text = super.responseText;
                if (this._reqUrl && (this._reqUrl.includes('youtubei/v1/player') || this._reqUrl.includes('youtubei/v1/watch'))) {
                    try {
                        let result = cleanYoutubeJSON(JSON.parse(text));
                        if (result.altered) return JSON.stringify(result.jsonObj);
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

        function bruteForceSkipAds() {
            const video = document.querySelector('video');
            const adContainers = document.querySelectorAll('.video-ads, .ytp-ad-module, .ytp-ad-player-overlay, ytm-promoted-sparkles-web-renderer');
            
            let hasAd = false;
            adContainers.forEach(container => {
                if (container && container.innerHTML.length > 0) hasAd = true;
            });

            if (hasAd && video) {
                video.muted = true;
                if (video.duration && !isNaN(video.duration)) {
                    video.currentTime = video.duration - 0.01;
                }
                video.playbackRate = 16;
                const skipButtons = document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
                skipButtons.forEach(btn => btn.click());
            }
        }
        setInterval(bruteForceSkipAds, 50);
    } 
    
    else {
        console.log("[Sayra] Running Android/PC mode");

        let _ytInitialPlayerResponse;
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

        self.fetch = async function(...args) {
            const fetchPromise = Reflect.apply(originalFetch, this, args);
            const url = args[0] instanceof Request ? args[0].url : args[0];

            if (typeof url === 'string' && (url.includes('youtubei/v1/player') || url.includes('youtubei/v1/watch'))) {
                return fetchPromise.then(async responseBefore => {
                    const responseClone = responseBefore.clone();
                    let text = await responseClone.text();
                    try {
                        let obj = JSON.parse(text);
                        const result = cleanYoutubeJSON(obj);
                        if (result.altered) {
                            console.log("[Sayra] Cleared Ads (Fetch):", url);
                            const responseAfter = new Response(JSON.stringify(result.jsonObj), {
                                status: responseBefore.status,
                                statusText: responseBefore.statusText,
                                headers: responseBefore.headers
                            });
                            Object.defineProperties(responseAfter, {
                                ok: { value: responseBefore.ok },
                                redirected: { value: responseBefore.redirected },
                                type: { value: responseBefore.type },
                                url: { value: responseBefore.url }
                            });
                            return responseAfter;
                        }
                    } catch (err) {}
                    return responseBefore;
                });
            }
            return fetchPromise;
        };

        self.XMLHttpRequest = class extends OriginalXHR {
            open(method, url, ...args) {
                this._reqUrl = typeof url === 'string' ? url : url.toString();
                return super.open(method, url, ...args);
            }
            get responseText() {
                let text = super.responseText;
                if (this._reqUrl && (this._reqUrl.includes('youtubei/v1/player') || this._reqUrl.includes('youtubei/v1/watch'))) {
                    try {
                        let obj = JSON.parse(text);
                        let result = cleanYoutubeJSON(obj);
                        if (result.altered) {
                            console.log("[Sayra] Cleared Ads (XHR Getter):", this._reqUrl);
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
                        let obj = JSON.parse(res);
                        let result = cleanYoutubeJSON(obj);
                        if (result.altered) return JSON.stringify(result.jsonObj);
                    } catch(e) {}
                }
                return res;
            }
        };
    }

})();
