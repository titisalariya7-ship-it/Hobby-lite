// YouTube IFrame Player API को एसिंक्रोनस रूप से लोड करें।
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let players = [];
let currentIndex = 0;

// ------------------- वीडियो एलिमेंट बनाना -------------------

// एक सिंगल वीडियो आइटम के लिए HTML एलिमेंट जनरेट करने का फ़ंक्शन
function createVideoElement(video) {
    const container = document.createElement('div');
    container.className = 'video-container';
    container.id = `video-container-${video.id}`;

    // YouTube Iframe के लिए Placeholder
    const playerDiv = document.createElement('div');
    playerDiv.id = `player-${video.id}`;
    
    // ओवरले सामग्री (टेक्स्ट, बटन, आदि)
    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    
    // टॉप बार
    overlay.innerHTML += `
        <div class="top-bar">
            <span>&lt; For You</span>
            <span>::</span>
        </div>
    `;

    // साइड बटन (लाइक, शेयर, स्पार्क)
    // Spark बटन Ad Popup को ट्रिगर करेगा
    overlay.innerHTML += `
        <div class="side-buttons">
            <div title="Like">💛</div> 
            <div title="Comment">💬</div>
            <div title="Share">↗️</div>
            <div id="ad-trigger-${video.id}" title="Spark (Ad)">⚡</div>
        </div>
    `;

    // वीडियो जानकारी
    overlay.innerHTML += `
        <div class="video-info">
            <p><strong>${video.username}</strong> <span style="opacity: 0.6;">Follow</span></p>
            <p>${video.caption}</p>
            <p style="font-size: 0.9em; opacity: 0.8;">♬ ${video.music}</p>
        </div>
    `;

    container.appendChild(playerDiv);
    container.appendChild(overlay);
    return container;
}

// ------------------- YouTube API और प्लेयर लॉजिक -------------------

// जब YouTube API लोड हो जाता है, तो यह फ़ंक्शन अपने आप कॉल होता है।
function onYouTubeIframeAPIReady() {
    const feed = document.getElementById('video-feed');
    
    // 1. सभी वीडियो कंटेनरों को बनाएं
    VIDEO_DATA.forEach(video => {
        feed.appendChild(createVideoElement(video));
    });

    // 2. पहला वीडियो तुरंत लोड करें
    if (VIDEO_DATA.length > 0) {
        loadPlayer(VIDEO_DATA[0].id, 0);
    }

    // 3. स्क्रॉल लिसनर सेट करें (ऑटो प्ले/पॉज और Lazy Loading के लिए)
    feed.addEventListener('scroll', handleScroll);
    
    // 4. Ad Trigger बटन सेट करें
    document.querySelectorAll('[id^="ad-trigger-"]').forEach(button => {
        button.addEventListener('click', showAdPopup);
    });
    
    document.getElementById('watch-ad-button').addEventListener('click', hideAdPopup);
    document.getElementById('cancel-ad-button').addEventListener('click', hideAdPopup);
}

// एक विशिष्ट प्लेयर को लोड और प्ले करने का फ़ंक्शन
function loadPlayer(videoId, index) {
    // अगर प्लेयर पहले से मौजूद है, तो बस उसे प्ले करें
    if (players[index]) {
        players[index].playVideo();
        return;
    }

    // एक नया प्लेयर इंस्टेंस बनाएं
    const player = new YT.Player(`player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'controls': 0,          // कंट्रोल्स छिपाएँ
            'rel': 0,               // संबंधित वीडियो को अक्षम करें
            'showinfo': 0,          // शीर्षक/अपलोडर छिपाएँ
            'modestbranding': 1,    // YouTube लोगो को छोटा करें
            'autoplay': 1,          // ऑटो-प्ले
            'loop': 1,
            'playlist': videoId     // लूप करने के लिए ज़रूरी
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
            },
            'onStateChange': (event) => {
                // वीडियो खत्म होने पर लूप के लिए फिर से प्ले करें
                if (event.data === YT.PlayerState.ENDED) {
                    event.target.playVideo(); 
                }
            }
        }
    });
    players[index] = player;
}

// ------------------- स्क्रॉलिंग और एड लॉजिक -------------------

// स्क्रॉल हैंडलर: कौन सा वीडियो दिख रहा है, यह तय करता है
function handleScroll() {
    const feed = document.getElementById('video-feed');
    const scrollPosition = feed.scrollTop;
    const windowHeight = window.innerHeight;
    
    // वर्तमान में केंद्रित वीडियो के इंडेक्स की गणना करें
    const newIndex = Math.round(scrollPosition / windowHeight);

    if (newIndex !== currentIndex) {
        // 1. पुराने वीडियो को पॉज करें
        if (players[currentIndex] && typeof players[currentIndex].pauseVideo === 'function') {
            players[currentIndex].pauseVideo();
        }

        // 2. इंडेक्स अपडेट करें
        currentIndex = newIndex;

        // 3. नए वीडियो को Lazy Load करके प्ले करें
        if (VIDEO_DATA[currentIndex]) {
            loadPlayer(VIDEO_DATA[currentIndex].id, currentIndex);
        }
        
        // *Lazy Loading* सुनिश्चित करता है कि हज़ारों वीडियो होने पर भी 
        // सिर्फ़ दिखने वाला वीडियो ही लोड हो, जिससे ऐप तेज़ रहता है।
    }
}

// Ad Popup दिखाने का फ़ंक्शन
function showAdPopup() {
    document