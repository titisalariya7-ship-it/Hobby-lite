// YouTube IFrame Player API को एसिंक्रोनस रूप से लोड करें।
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let players = [];
let currentIndex = 0;

// एक नया वीडियो एलिमेंट और ओवरले बनाता है
function createVideoElement(video) {
    const container = document.createElement('div');
    container.className = 'video-container';
    container.id = 'container-' + video.id;

    // YouTube Iframe के लिए Placeholder
    const playerDiv = document.createElement('div');
    playerDiv.id = 'player-' + video.id;

    // ओवरले (लाइक, शेयर, नाम, आदि)
    const overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    
    // टॉप बार (For You)
    overlay.innerHTML += `
        <div class="top-bar">
            <span class="back"><span style="font-size: 2rem;">&lt;</span> For You</span>
            <span class="menu"><span style="font-size: 2rem;">&#8942;</span></span>
        </div>
    `;

    // साइड बटन्स (लाइक, शेयर, स्पार्क)
    overlay.innerHTML += `
        <div class="side-buttons">
            <div class="button like">❤️</div>
            <div class="button comment">💬</div>
            <div class="button share">↗️</div>
            <div class="button ad-trigger" title="Spark">⚡</div>
        </div>
    `;

    // वीडियो जानकारी
    overlay.innerHTML += `
        <div class="video-info">
            <div class="user-info">
                <strong><span class="username">${video.username}</span></strong> 
                <span style="opacity: 0.6;">•</span>
                <span style="opacity: 0.8; font-weight: 500;">Follow</span>
            </div>
            <p class="video-caption">${video.caption}</p>
            <p class="video-music">🎵 ${video.music}</p>
        </div>
    `;

    container.appendChild(playerDiv);
    container.appendChild(overlay);
    return container;
}

// जब YouTube API लोड हो जाता है, तो यह फ़ंक्शन चलता है
function onYouTubeIframeAPIReady() {
    const feed = document.getElementById('video-feed');
    
    // सभी वीडियो कंटेनर को बनाएँ
    VIDEO_DATA.forEach(video => {
        feed.appendChild(createVideoElement(video));
    });

    // पहले वीडियो को प्ले करें और Lazy Loading शुरू करें
    if (VIDEO_DATA.length > 0) {
        loadPlayer(VIDEO_DATA[0].id, 0);
    }
    
    // स्क्रॉल इवेंट लिसनर जोड़ें (Lazy Loading के लिए)
    feed.addEventListener('scroll', handleScroll);
    
    // Ad Popup ट्रिगर जोड़ें
    document.querySelectorAll('.ad-trigger').forEach(button => {
        button.addEventListener('click', showAdPopup);
    });
    
    // Ad बंद करने के बटन जोड़ें
    document.getElementById('watch-ad-button').addEventListener('click', hideAdPopup);
    document.getElementById('cancel-ad-button').addEventListener('click', hideAdPopup);
    
    // शुरुआती लोड पर Ad Popup छिपा दें
    document.getElementById('ad-popup').classList.add('hidden');
}

// एक प्लेयर लोड या प्ले करता है
function loadPlayer(videoId, index) {
    // अगर प्लेयर पहले से मौजूद है, तो बस उसे प्ले करें
    if (players[index]) {
        players[index].playVideo();
        return;
    }

    // एक नया प्लेयर इंस्टैंस बनाएँ
    const player = new YT.Player(`player-${videoId}`, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'controls': 0,          // कंट्रोल्स छिपाएँ
            'rel': 0,               // संबंधित वीडियो को अक्षम करें
            'showinfo': 0,          // शीर्षक/अपलोडर छिपाएँ
            'modestbranding': 1,    // YouTube लोगो को छिपाएँ
            'autoplay': 1,          // ऑटो-प्ले
            'loop': 1,              // लूप करने के लिए ज़रूरी
            'playlist': videoId     // लूप करने के लिए ज़रूरी
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
            },
            'onStateChange': (event) => {
                // वीडियो ख़त्म होने पर लूप के लिए फिर से प्ले करें
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
            // Lazy Loading सुनिश्चित करता है कि सिर्फ़ दिखने वाला वीडियो ही लोड हो, जिससे ऐप तेज़ रहता है
            loadPlayer(VIDEO_DATA[currentIndex].id, currentIndex); 
        }
    }
}

// Ad Popup दिखाने का फ़ंक्शन
function showAdPopup() {
    document.getElementById('ad-popup').classList.remove('hidden');
    // Ad दिखने पर वर्तमान वीडियो को पॉज करें
    if (players[currentIndex] && typeof players[currentIndex].pauseVideo === 'function') {
        players[currentIndex].pauseVideo();
    }
}

// Ad Popup छिपाने का फ़ंक्शन
function hideAdPopup() {
    document.getElementById('ad-popup').classList.add('hidden');
    // Ad बंद होने पर वीडियो फिर से प्ले करें
    if (players[currentIndex] && typeof players[currentIndex].playVideo === 'function') {
        players[currentIndex].playVideo();
    }
}

// यह लाइन स्क्रिप्ट लोड होते ही Ad Popup को छिपा देती है
document.getElementById('ad-popup').classList.add('hidden');
