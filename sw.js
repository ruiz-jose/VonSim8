if(!self.define){let e,i={};const o=(o,n)=>(o=new URL(o+".js",n).href,i[o]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=o,e.onload=i,document.head.appendChild(e)}else e=o,importScripts(o),i()})).then((()=>{let e=i[o];if(!e)throw new Error(`Module ${o} didn’t register its module`);return e})));self.define=(n,s)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(i[r])return;let t={};const f=e=>o(e,r),a={module:{uri:r},exports:t,require:f};i[r]=Promise.all(n.map((e=>a[e]||f(e)))).then((e=>(s(...e),t)))}}define(["./workbox-7433da6c"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-Cj7QQiwz.js",revision:null},{url:"assets/index-CLuxrG6Q.css",revision:null},{url:"assets/workbox-window.prod.es5-B9K5rw8f.js",revision:null},{url:"index.html",revision:"5b88a73d29ec4ff5b14ba1ae0fe98d53"},{url:"favicon.svg",revision:"1ff6867dbe53fea165ed2c50094f1bdd"},{url:"icon-192.png",revision:"e6b9cbe10609c3309a08a0fa1fc1e6d2"},{url:"icon-512.png",revision:"d60d066b82378f19644d8afece4a0b3d"},{url:"fonts/chivo/Chivo-Italic[wght].ttf",revision:"81b5b8c8cdc073e16f2634777e09a4d7"},{url:"fonts/chivo/Chivo[wght].ttf",revision:"f7c6cd0c2dec6b505ee1e79310a256e8"},{url:"fonts/chivo/OFL.txt",revision:"9e202679ebd39badca87c6a6a33cbfc6"},{url:"fonts/jetbrains-mono/JetBrainsMono-Italic[wght].woff2",revision:"57eb8a9eff24819176d3e9020e764a99"},{url:"fonts/jetbrains-mono/JetBrainsMono[wght].woff2",revision:"aac0d356bc8119aaba375427edb06b52"},{url:"fonts/jetbrains-mono/OFL.txt",revision:"43dc1a748ef82aa746d6a645d52578a9"},{url:"manifest.webmanifest",revision:"81db866e46ef6f3eca3db6a4bd26571b"}],{}),e.cleanupOutdatedCaches()}));
