// ==UserScript==
// @name         Tiện ích AnimeVietsub
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  
// @author       Sayra & Gemini
// @match        *://animevietsub.pl/*
// @match        *://animevietsub.fan/*
// @match        *://*.animevietsub.pl/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animevietsub.pl
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    
    const adKeywords = [
        'popunder', 'googleads', 'doubleclick', 'ima3.js', 'vast', 'vpaid', 
        'yo88', 'hitclub', 'gemwin', 'zowin', 'rikvip', 'sunwin', 'debet', 
        '3bet', 'five88', 'sin88', 'ball88', 'sv88', 'bom88', '/ads/', 'qc.'
    ];

    const originalFetch = win.fetch;
    win.fetch = async function(...args) {
        const requestUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
        if (adKeywords.some(kw => requestUrl.toLowerCase().includes(kw))) {
            console.log('🛑 [Destroyed] Blocked Fetch ads:', requestUrl);
            return new Response('', { status: 200 });
        }
        return originalFetch.apply(this, args);
    };

    const originalXHR = win.XMLHttpRequest.prototype.open;
    win.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && adKeywords.some(kw => url.toLowerCase().includes(kw))) {
            console.log('🛑 [Destroyed] Blocked XHR advertising:', url);
            url = 'data:application/json,{"status":"blocked"}';
        }
        return originalXHR.call(this, method, url, ...rest);
    };

    const originalWindowOpen = win.open;
    win.open = function(url, name, specs) {
        if (typeof url === 'string' && adKeywords.some(kw => url.toLowerCase().includes(kw))) {
            console.log('🛑 [Destroyed] Blocked Popunder (window.open):', url);
            return null;
        }
        return originalWindowOpen.call(this, url, name, specs);
    };

    win.PopupManager = function() { console.log("🔥 [AdBlock] Destroyed PopupManager!"); };
    win.createPopupAndRedirect = function(url) { console.log("🔥 [AdBlock] Destroyed createPopupAndRedirect payload to:", url); };
    win.markPopupAsOpened = function() {  };

    GM_addStyle(`
        .Adv, .ad-center-header, .header-ads-mobile,
        .Ads, .ads_player, .bellow_ads_player, .below-playerm,
        #mobile-catfixx, .mb_catfix_adv,
        #mobile-catfish-top, .mb_catfix_advt,
        .ads-textlink, .ads-300, div[id^="_preload-ads"],

        .jw-ad, 
        .jw-pause-ad-container, 
        .jw-ad-overlay, 
        .jw-plugin-googima, 
        .jw-plugin-ima,
        .jw-display-icon-container .jw-overlay,
        #media-player-box iframe[src*="qc."],
        #media-player-box iframe[src*="ads"] {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -9999 !important;
            visibility: hidden !important;
        }

        #watch-block { margin-top: 10px !important; }
    `);

    const destroyDOMAds = () => {
        const adSelectors = [
            '.Adv', '.header-ads-mobile', '.Ads', 
            '#mobile-catfixx', '#mobile-catfish-top', 
            '.ads-textlink', '.ads-300', 'div[id^="_preload-ads"]',
            '.jw-pause-ad-container', 'iframe[src*="yo88"]', 'iframe[src*="hitclub"]'
        ];

        adSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(ad => ad.remove());
        });
    };

    window.addEventListener('DOMContentLoaded', destroyDOMAds);

    const observer = new MutationObserver(() => {
        destroyDOMAds();
    });

    const startObserver = () => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            requestAnimationFrame(startObserver);
        }
    };
    startObserver();
})();
