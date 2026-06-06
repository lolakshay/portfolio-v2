/**
 * Space Radio & Music Console Engine
 * Developed for Akshay Srinivas Portfolio
 */

(function() {
    // Playlist Definition
    const playlist = [
        {
            title: "I Wanna Be Yours",
            artist: "Arctic Monkeys",
            file: "assets/songs/Arctic Monkeys - I Wanna Be Yours.mp3",
            cover: "assets/song-album-covers/i-wanna-be-yours.jpg",
            rating: 68
        },
        {
            title: "The Night Will Always Win",
            artist: "Elbow",
            file: "assets/songs/Black ops 2 intro video...Elbow - The Night Will Always Win.mp3",
            cover: "assets/song-album-covers/elbow-nights-always-win.jpg",
            rating: 74
        },
        {
            title: "Careless Whisper",
            artist: "George Michael",
            file: "assets/songs/George Michael - Careless Whisper (Lyrics).mp3",
            cover: "assets/song-album-covers/careless-whispers-drift.png",
            rating: 89
        },
        {
            title: "Kerosene",
            artist: "Crystal Castles",
            file: "assets/songs/Crystal Castles  KEROSENE Lyrics.mp3",
            cover: "assets/song-album-covers/kerosene-song-album-cover.png",
            rating: 95
        },
        {
            title: "Let Her Go",
            artist: "Passenger",
            file: "assets/songs/Passenger  Let Her Go Official Video.mp3",
            cover: "assets/song-album-covers/let-her-go.jpg",
            rating: 81
        },
        {
            title: "Night Changes",
            artist: "One Direction",
            file: "assets/songs/One Direction  Night Changes Lyrics.mp3",
            cover: "assets/song-album-covers/one-direction-night-changes.jpg",
            rating: 79
        },
        {
            title: "Roses",
            artist: "Wxrld24",
            file: "assets/songs/Wxrld24 - ROSES (Official Audio).mp3",
            cover: "assets/song-album-covers/wxrld24-roses.jpg",
            rating: 56
        },
        {
            title: "Falling",
            artist: "Trevor Daniel",
            file: "assets/songs/Trevor Daniel  Falling Lyrics.mp3",
            cover: "assets/song-album-covers/falling-trevor-daniel.jpg",
            rating: 63
        },
        {
            title: "I Think They Call This Love",
            artist: "Elliot James Reay",
            file: "assets/songs/Elliot James Reay - I Think They Call This Love (Official Lyric Video).mp3",
            cover: "assets/song-album-covers/i-think-they-call-this-love.jpeg",
            rating: 70
        },
        {
            title: "FitGirl Repack Theme",
            artist: "FitGirl",
            file: "assets/songs/fit-girl-song.mp3",
            cover: "assets/song-album-covers/fitgirl-repack.jpg",
            rating: 99
        }
    ];

    // State Variables
    let currentTrackIdx = 0;
    let isPlaying = false;
    let audioContext = null;
    let analyser = null;
    let audioSource = null;
    let gainNode = null;
    let dataArray = null;
    let animationFrameId = null;
    let isMuted = localStorage.getItem('cosmic-sfx-muted') === 'true';
    let lastVolume = parseFloat(localStorage.getItem('cosmic-sfx-last-volume') || '0.5');

    // Persistent global audio element
    if (!window.globalAudioElement) {
        window.globalAudioElement = new Audio();
        const savedVol = localStorage.getItem('cosmic-sfx-volume');
        window.globalAudioElement.volume = savedVol !== null ? parseFloat(savedVol) : (isMuted ? 0.0 : 0.5);
    }
    const audio = window.globalAudioElement;

    // Initialize function called by navigation router
    window.initMusicPlayer = function() {
        console.log("Initializing premium music player...");

        // Clean up previous event listeners and frames to avoid leakage
        if (typeof window.cleanupMusicPlayer === 'function') {
            window.cleanupMusicPlayer();
        }

        let mouseMoveSeekHandler = null;
        let mouseUpSeekHandler = null;
        let resizeHandler = null;

        // Cache DOM elements
        const tilesGrid = document.getElementById('music-tiles-grid');
        const playBtn = document.getElementById('player-play');
        const prevBtn = document.getElementById('player-prev');
        const nextBtn = document.getElementById('player-next');
        const volumeSlider = document.getElementById('volume-slider');
        const volumeToggle = document.getElementById('volume-toggle');
        const ratingBtn = document.getElementById('rating-btn');
        const ratingCount = document.getElementById('rating-count');
        const downloadBtn = document.getElementById('download-track');
        const playerClose = document.getElementById('player-close');
        const waveformTimeline = document.getElementById('waveform-timeline');

        if (!tilesGrid) {
            console.error("Music DOM elements missing!");
            return;
        }

        // Populate playlist tiles
        tilesGrid.innerHTML = '';
        playlist.forEach((track, index) => {
            const floatDelay = -(Math.random() * 5).toFixed(2);
            const floatDuration = (4.5 + Math.random() * 2.5).toFixed(2);

            const card = document.createElement('button');
            card.className = `music-card ${index === currentTrackIdx ? 'active-tile' : ''}`;
            card.style.setProperty('--float-delay', `${floatDelay}s`);
            card.style.setProperty('--float-duration', `${floatDuration}s`);
            card.setAttribute('aria-label', `Play ${track.title} by ${track.artist}`);

            card.innerHTML = `
                <div class="music-card-wrapper">
                    <img src="${track.cover}" class="music-card-cover" alt="${track.title} Cover">
                </div>
                <div class="music-card-title">${track.title}</div>
            `;

            // Click to play
            card.addEventListener('click', () => {
                playTrack(index);
            });

            // Hover Sound Effect
            card.addEventListener('mouseenter', () => {
                playSfx('hover');
            });

            tilesGrid.appendChild(card);
        });

        // Setup DOM event listeners
        if (playBtn) {
            playBtn.onclick = () => {
                if (isPlaying) {
                    pause();
                } else {
                    play();
                }
            };
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                let idx = currentTrackIdx - 1;
                if (idx < 0) idx = playlist.length - 1;
                playTrack(idx);
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                let idx = currentTrackIdx + 1;
                if (idx >= playlist.length) idx = 0;
                playTrack(idx);
            };
        }

        if (volumeSlider) {
            volumeSlider.oninput = (e) => {
                const vol = parseFloat(e.target.value);
                setVolume(vol);
            };
            volumeSlider.value = audio.volume;
        }

        if (volumeToggle) {
            volumeToggle.onclick = () => {
                toggleMute();
            };
        }

        if (ratingBtn) {
            ratingBtn.onclick = () => {
                ratingBtn.classList.toggle('active');
                const isFav = ratingBtn.classList.contains('active');
                const baseRating = playlist[currentTrackIdx].rating;
                ratingCount.textContent = isFav ? baseRating + 1 : baseRating;
            };
        }

        if (playerClose) {
            playerClose.onclick = () => {
                // Minimize player or navigate back home
                pause();
                const homeBtn = document.querySelector('.home-btn');
                if (homeBtn) homeBtn.click();
            };
        }

        // Setup Waveform click seek
        if (waveformTimeline) {
            waveformTimeline.onclick = (e) => {
                const rect = waveformTimeline.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, clickX / rect.width));
                if (audio.duration) {
                    audio.currentTime = percent * audio.duration;
                    updateProgressUI();
                }
            };

            // Drag support
            let isDraggingWaveform = false;
            waveformTimeline.onmousedown = () => {
                isDraggingWaveform = true;
            };

            mouseMoveSeekHandler = (e) => {
                if (!isDraggingWaveform) return;
                const rect = waveformTimeline.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = Math.max(0, Math.min(1, clickX / rect.width));
                if (audio.duration) {
                    audio.currentTime = percent * audio.duration;
                    updateProgressUI();
                }
            };

            mouseUpSeekHandler = () => {
                isDraggingWaveform = false;
            };

            window.addEventListener('mousemove', mouseMoveSeekHandler);
            window.addEventListener('mouseup', mouseUpSeekHandler);
        }

        // Setup audio element listeners
        audio.onended = () => {
            // Auto advance next
            let idx = currentTrackIdx + 1;
            if (idx >= playlist.length) idx = 0;
            playTrack(idx);
        };

        audio.ontimeupdate = () => {
            if (document.getElementById('waveform-progress-line')) {
                updateProgressUI();
            }
        };

        audio.onloadedmetadata = () => {
            if (document.getElementById('total-duration')) {
                updateDurationLabels();
                generateWaveformUI(playlist[currentTrackIdx].title);
            }
        };

        // Initialize state view matching audio state
        updateTrackUI();
        updateProgressUI();
        updateDurationLabels();
        generateWaveformUI(playlist[currentTrackIdx].title);
        syncVolumeIcon();
        window.setMusicVolume = setVolume;

        // Start Canvas Visualizer Loop
        initCanvasVisualizer();

        // Register window cleanups for SPA navigation
        window.cleanupMusicPlayer = () => {
            window.setMusicVolume = null;
            if (mouseMoveSeekHandler) {
                window.removeEventListener('mousemove', mouseMoveSeekHandler);
            }
            if (mouseUpSeekHandler) {
                window.removeEventListener('mouseup', mouseUpSeekHandler);
            }
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        };
    };

    // Helper to format track times
    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function playSfx(name) {
        if (window.playSfx) {
            try {
                window.playSfx(name);
            } catch (e) {}
        }
    }

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            audioSource = audioContext.createMediaElementSource(audio);
            gainNode = audioContext.createGain();

            audioSource.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(audioContext.destination);

            gainNode.gain.setValueAtTime(audio.volume, audioContext.currentTime);
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function playTrack(index) {
        initAudioContext();
        currentTrackIdx = index;
        const track = playlist[index];

        // Highlight active card
        const cards = document.querySelectorAll('.music-tiles-grid .music-card');
        cards.forEach((c, idx) => {
            if (idx === index) {
                c.classList.add('playing');
            } else {
                c.classList.remove('playing');
            }
        });

        // Set source
        audio.src = track.file;
        audio.load();
        
        play();
        updateTrackUI();
    }

    function play() {
        initAudioContext();
        audio.play().then(() => {
            isPlaying = true;
            updatePlayPauseButton();
            document.getElementById('player-cover').classList.add('spinning');
        }).catch(err => {
            console.log("Audio play deferred until user interaction:", err);
        });
    }

    function pause() {
        audio.pause();
        isPlaying = false;
        updatePlayPauseButton();
        document.getElementById('player-cover').classList.remove('spinning');
    }

    function setVolume(val) {
        audio.volume = val;
        if (gainNode) {
            gainNode.gain.setValueAtTime(val, audioContext ? audioContext.currentTime : 0);
        }
        
        // Sync with header volume slider
        const headerSlider = document.getElementById('header-volume-slider');
        if (headerSlider) {
            headerSlider.value = val;
        }
        
        // Save preferences
        localStorage.setItem('cosmic-sfx-volume', val.toString());
        if (val > 0) {
            lastVolume = val;
            localStorage.setItem('cosmic-sfx-last-volume', val.toString());
            isMuted = false;
            localStorage.setItem('cosmic-sfx-muted', 'false');
        } else {
            isMuted = true;
            localStorage.setItem('cosmic-sfx-muted', 'true');
        }
        
        // Update header mute UI state
        const audioBtns = document.querySelectorAll('.audio-btn');
        const soundEnabledSVG = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
        const soundDisabledSVG = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
        audioBtns.forEach(btn => {
            btn.innerHTML = isMuted ? soundDisabledSVG : soundEnabledSVG;
            btn.style.borderColor = isMuted ? "rgba(138, 43, 226, 0.25)" : "var(--color-contact)";
            btn.setAttribute('aria-label', isMuted ? "Unmute sound effects" : "Mute sound effects");
        });
        
        syncVolumeIcon();
    }

    function toggleMute() {
        const slider = document.getElementById('volume-slider');
        if (isMuted) {
            setVolume(lastVolume);
            isMuted = false;
            if (slider) slider.value = lastVolume;
        } else {
            lastVolume = audio.volume > 0 ? audio.volume : 0.7;
            setVolume(0);
            isMuted = true;
            if (slider) slider.value = 0;
        }
        syncVolumeIcon();
    }

    function syncVolumeIcon() {
        const icon = document.getElementById('volume-icon');
        if (!icon) return;
        if (audio.volume === 0) {
            icon.innerHTML = `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
        } else if (audio.volume < 0.4) {
            icon.innerHTML = `<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>`;
        } else {
            icon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
        }
    }

    function updatePlayPauseButton() {
        const playIcon = document.getElementById('play-icon');
        const pauseIcon = document.getElementById('pause-icon');
        if (playIcon && pauseIcon) {
            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }
    }

    function updateTrackUI() {
        const track = playlist[currentTrackIdx];
        
        // Text metadata
        const titleEl = document.getElementById('player-title');
        const artistEl = document.getElementById('player-artist');
        const coverEl = document.getElementById('player-cover');
        const downloadEl = document.getElementById('download-track');
        const ratingBtn = document.getElementById('rating-btn');
        const ratingCount = document.getElementById('rating-count');

        // Check if a track is actually loaded in the global audio element
        const isTrackLoaded = audio.src && !audio.src.endsWith('/') && audio.src !== window.location.href;

        if (titleEl) titleEl.textContent = isTrackLoaded ? track.title : "Select a track...";
        if (artistEl) artistEl.textContent = isTrackLoaded ? track.artist : "Choose from the playlist";
        if (coverEl) {
            coverEl.src = isTrackLoaded ? track.cover : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            if (isPlaying && isTrackLoaded) {
                coverEl.classList.add('spinning');
            } else {
                coverEl.classList.remove('spinning');
            }
        }
        if (downloadEl) {
            if (isTrackLoaded) {
                downloadEl.href = track.file;
                downloadEl.setAttribute('download', `${track.artist} - ${track.title}.mp3`);
                downloadEl.style.opacity = '1';
                downloadEl.style.pointerEvents = 'auto';
            } else {
                downloadEl.href = '#';
                downloadEl.removeAttribute('download');
                downloadEl.style.opacity = '0.4';
                downloadEl.style.pointerEvents = 'none';
            }
        }

        // Heart rating button reset
        if (ratingBtn && ratingCount) {
            ratingBtn.classList.remove('active');
            ratingCount.textContent = isTrackLoaded ? track.rating : "0";
        }

        // Active card highlight
        const cards = document.querySelectorAll('.music-tiles-grid .music-card');
        cards.forEach((c, idx) => {
            if (idx === currentTrackIdx && isTrackLoaded) {
                c.classList.add('playing');
            } else {
                c.classList.remove('playing');
            }
        });
    }

    function updateProgressUI() {
        const progressLine = document.getElementById('waveform-progress-line');
        const playhead = document.getElementById('waveform-playhead');
        const playheadBadge = document.getElementById('playhead-badge');
        const currentTimeEl = document.getElementById('current-time');

        if (!audio.duration) return;

        const percent = (audio.currentTime / audio.duration) * 100;
        
        if (progressLine) progressLine.style.width = `${percent}%`;
        if (playhead) playhead.style.left = `${percent}%`;
        if (playheadBadge) playheadBadge.textContent = formatTime(audio.currentTime);
        if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);

        // Highlight bars matching progress
        const bars = document.querySelectorAll('.waveform-bars .wave-bar');
        const barsCount = bars.length;
        const activeCount = Math.floor((percent / 100) * barsCount);
        
        bars.forEach((bar, idx) => {
            if (idx <= activeCount) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    }

    function updateDurationLabels() {
        const totalDurationEl = document.getElementById('total-duration');
        if (totalDurationEl && audio.duration) {
            totalDurationEl.textContent = formatTime(audio.duration);
        }
    }

    // Custom deterministic waveform display based on track title hash
    function generateWaveformUI(title) {
        const barsContainer = document.getElementById('waveform-bars');
        if (!barsContainer) return;

        barsContainer.innerHTML = '';
        const barCount = 75;

        // Generate deterministic seed from title
        let seed = 0;
        for (let i = 0; i < title.length; i++) {
            seed += title.charCodeAt(i);
        }

        // Deterministic pseudo-random number generator
        function randomSeed(x) {
            const val = Math.sin(x) * 10000;
            return val - Math.floor(val);
        }

        for (let idx = 0; idx < barCount; idx++) {
            const bar = document.createElement('div');
            bar.className = 'wave-bar';
            
            // Draw a beautiful symmetric envelope wave
            const distFromCenter = Math.abs(idx - barCount / 2) / (barCount / 2);
            const envelope = Math.max(0.15, 1 - distFromCenter * distFromCenter * 0.85);
            
            const randVal = randomSeed(seed + idx);
            const rawHeight = 12 + randVal * 18; // Height between 12px and 30px
            const heightVal = Math.round(rawHeight * envelope);

            bar.style.height = `${heightVal}px`;
            barsContainer.appendChild(bar);
        }
    }

    // Canvas visualizer loop
    function initCanvasVisualizer() {
        const canvas = document.getElementById('star-visualizer');
        const visLineGreen = document.getElementById('vis-line-green');
        const visLineYellow = document.getElementById('vis-line-yellow');

        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = 0;
        let height = 0;

        function resize() {
            if (!canvas) return;
            // Avoid scheduling retries if canvas was unmounted/removed
            if (canvas.isConnected === false) return;

            const rect = canvas.getBoundingClientRect();
            width = rect.width;
            height = rect.height;

            // If layout reflow hasn't completed yet, retry in 50ms
            if (width === 0 || height === 0) {
                setTimeout(resize, 50);
                return;
            }

            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resize();

        // Handle resize
        resizeHandler = resize;
        window.addEventListener('resize', resizeHandler);

        // Array to smooth out frequency scaling
        const smoothedRanges = new Array(120).fill(0);

        let coverRotation = 0;

        function drawLoop() {
            if (!canvas || !canvas.isConnected) return;
            animationFrameId = requestAnimationFrame(drawLoop);

            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;
            const baseRadius = Math.min(width, height) * 0.25;

            // Rotate active album cover inside the circle
            if (isPlaying) {
                coverRotation += 0.006;
            }

            let bassAvg = 0;
            let midAvg = 0;
            let trebleAvg = 0;

            if (isPlaying && analyser) {
                analyser.getByteFrequencyData(dataArray);

                // Compute averages for frequencies
                for (let i = 0; i < 8; i++) bassAvg += dataArray[i];
                for (let i = 8; i < 36; i++) midAvg += dataArray[i];
                for (let i = 36; i < 70; i++) trebleAvg += dataArray[i];

                bassAvg /= 8;
                midAvg /= 28;
                trebleAvg /= 34;

                // Sync subtle page vibration with deep bass hits
                const container = document.querySelector('.music-page-wrapper');
                if (container) {
                    if (bassAvg > 165) {
                        container.classList.add('bass-shake-active');
                    } else {
                        container.classList.remove('bass-shake-active');
                    }
                }

                // Animate secondary green & yellow equalizer bars below visualizer
                if (visLineGreen) {
                    visLineGreen.style.width = `${Math.min(100, Math.max(10, (bassAvg / 255) * 105))}%`;
                    visLineGreen.style.filter = `hue-rotate(${(bassAvg * 0.15)}deg)`;
                }
                if (visLineYellow) {
                    visLineYellow.style.width = `${Math.min(100, Math.max(15, (midAvg / 255) * 110))}%`;
                }
            } else {
                // Return to normal
                const container = document.querySelector('.music-page-wrapper');
                if (container) container.classList.remove('bass-shake-active');

                if (visLineGreen) visLineGreen.style.width = '65%';
                if (visLineYellow) visLineYellow.style.width = '45%';
            }

            // Draw background glow pulsing with bass
            const glowRadius = baseRadius + (bassAvg * 0.15);
            const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius * 1.8);
            glowGrad.addColorStop(0, 'rgba(0, 162, 255, 0.14)');
            glowGrad.addColorStop(0.5, 'rgba(138, 43, 226, 0.05)');
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, glowRadius * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Draw radial frequency bars
            ctx.lineCap = 'round';
            ctx.lineWidth = 3.5;
            
            const numBars = 120;
            const angleStep = (Math.PI * 2) / numBars;
            const maxBarLength = Math.min(width, height) * 0.22;
            
            for (let i = 0; i < numBars; i++) {
                // Symmetrical mapping: mirror left and right
                const halfBars = numBars / 2;
                const index = i < halfBars ? i : numBars - 1 - i;
                
                // Map to frequency bins (0 to 60)
                const freqIndex = Math.floor((index / halfBars) * 60) + 1;
                const rawValue = dataArray ? dataArray[freqIndex] : 0;
                
                // Treble boost: scale higher frequencies so they stand out as much as bass
                const trebleBoost = 1.0 + (index / halfBars) * 1.1;
                
                // Calculate target height for this bar (active vs idle state)
                let targetHeight = 0;
                if (isPlaying && dataArray) {
                    const normalized = Math.min(1.0, (rawValue * trebleBoost) / 255);
                    targetHeight = Math.pow(normalized, 1.45) * maxBarLength * 0.9;
                } else {
                    const idleFreq = Date.now() * 0.0025;
                    targetHeight = 4 + Math.sin(idleFreq + i * 0.18) * 3.5;
                }
                
                // Smoothly interpolate current bar height to target height (removes sudden transitions)
                smoothedRanges[i] = smoothedRanges[i] * 0.85 + targetHeight * 0.15;
                
                // Offset angle so the mirrored halves align nicely (vertical axis split)
                const angle = i * angleStep - Math.PI / 2;
                
                const startX = cx + Math.cos(angle) * baseRadius;
                const startY = cy + Math.sin(angle) * baseRadius;
                const endX = cx + Math.cos(angle) * (baseRadius + smoothedRanges[i]);
                const endY = cy + Math.sin(angle) * (baseRadius + smoothedRanges[i]);
                
                // Set colorful rainbow HSL stroke (no shadowBlur to keep rendering 100% lag-free)
                const hue = ((i / numBars) * 360 + Date.now() * 0.022) % 360;
                ctx.strokeStyle = `hsla(${hue}, 92%, 65%, 0.85)`;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
            
            // Draw central Album Cover (Clipped to a circle & rotating smoothly)
            const coverImg = document.getElementById('player-cover');
            if (coverImg && coverImg.complete && coverImg.naturalWidth !== 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                
                ctx.translate(cx, cy);
                ctx.rotate(coverRotation);
                ctx.drawImage(coverImg, -baseRadius, -baseRadius, baseRadius * 2, baseRadius * 2);
                
                ctx.restore();
            } else {
                // Fallback to solid background
                ctx.fillStyle = '#0a0514';
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Draw subtle border around the central circle
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        drawLoop();
    }
})();
