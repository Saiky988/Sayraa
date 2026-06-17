// ==UserScript==
// @name         Tiện ích AnimeVietsub
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  BlockAds
// @author       Sayraa, Gemini
// @match        *://animevietsub.pl/*
// @match        *://animevietsub.fan/*
// @match        *://*.animevietsub.pl/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=animevietsub.pl
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        .Adv, .ad-center-header, .header-ads-mobile,
        .Ads, .ads_player, .bellow_ads_player, .below-playerm,
        #mobile-catfixx, .mb_catfix_adv,
        #mobile-catfish-top, .mb_catfix_advt,
        .ads-textlink, .ads-300,
        div[id^="_preload-ads"] {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -9999 !important;
        }
        #watch-block { margin-top: 10px !important; }
    `);

    const destroyAds = () => {
        const adSelectors = [
            '.Adv', '.header-ads-mobile', '.Ads', 
            '#mobile-catfixx', '#mobile-catfish-top', 
            '.ads-textlink', '.ads-300', 'div[id^="_preload-ads"]'
        ];

        adSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(ad => ad.remove());
        });
    };

    window.addEventListener('DOMContentLoaded', destroyAds);

    const observer = new MutationObserver(() => {
        destroyAds();
    });

    const startObserver = () => {
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            requestAnimationFrame(startObserver);
        }
    };
    startObserver();

    window.PopupManager = function() {
        console.log("AnimeVietsub Ad Blocker");
    };
})();
