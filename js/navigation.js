(function () {
    // Sound FX mute preference state
    let isSfxMuted = localStorage.getItem('cosmic-sfx-muted') === 'true';

    // SVG icons for enabled/disabled SFX states
    const soundEnabledSVG = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const soundDisabledSVG = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

    function updateAudioButtonUI() {
        const audioBtns = document.querySelectorAll('.audio-btn');
        audioBtns.forEach(btn => {
            btn.innerHTML = isSfxMuted ? soundDisabledSVG : soundEnabledSVG;
            btn.style.borderColor = isSfxMuted ? "rgba(138, 43, 226, 0.25)" : "var(--color-contact)";
            btn.setAttribute('aria-label', isSfxMuted ? "Unmute sound effects" : "Mute sound effects");
        });
    }

    // High-performance Web Audio API Sound Effects system
    let sfxContext = null;
    const soundBuffers = {};

    function initSfxContext() {
        if (!sfxContext) {
            sfxContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (sfxContext.state === 'suspended') {
            sfxContext.resume();
        }
    }

    function preloadSfx(name, url) {
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error("Audio file not ready");
                return res.arrayBuffer();
            })
            .then(buffer => {
                initSfxContext();
                return sfxContext.decodeAudioData(buffer);
            })
            .then(audioBuffer => {
                soundBuffers[name] = audioBuffer;
            })
            .catch(() => {
                // Silently fallback to synth in real time
            });
    }

    // Attempt loading custom audio files
    preloadSfx('hover', 'assets/audio/menu.m4a');
    preloadSfx('go', 'assets/audio/go-menu.m4a');
    preloadSfx('come', 'assets/audio/come-menu.m4a');

    // Trigger instant sounds with Web Audio API (0ms latency buffer source)
    function playSfx(name) {
        if (isSfxMuted) return;
        initSfxContext();
        
        // Play custom decoded mp3 file buffer if ready
        const buffer = soundBuffers[name];
        if (buffer && sfxContext) {
            const source = sfxContext.createBufferSource();
            source.buffer = buffer;
            source.connect(sfxContext.destination);
            source.start(0);
            return;
        }

        // Real-time zero-delay synth fallback if custom mp3s are absent/not loaded
        if (sfxContext) {
            try {
                const osc = sfxContext.createOscillator();
                const gain = sfxContext.createGain();
                osc.connect(gain);
                gain.connect(sfxContext.destination);

                const now = sfxContext.currentTime;
                if (name === 'hover') {
                    // Snappy digital menu cursor double-blip
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(580, now);
                    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.04);
                    gain.gain.setValueAtTime(0.035, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                    osc.start(now);
                    osc.stop(now + 0.07);
                } else if (name === 'go') {
                    // Futuristic warp confirmation sweep
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(350, now);
                    osc.frequency.exponentialRampToValueAtTime(1500, now + 0.12);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                    osc.start(now);
                    osc.stop(now + 0.18);
                } else if (name === 'come') {
                    // Futuristic landing portal sweep
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(180, now + 0.28);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.32);
                }
            } catch (e) {}
        }
    }

    // Warm-up Web Audio Context on first cursor move or gesture
    function warmUpAudio() {
        initSfxContext();
        // Retry preloads in case context is ready
        if (!soundBuffers['hover']) preloadSfx('hover', 'assets/audio/menu.m4a');
        if (!soundBuffers['go']) preloadSfx('go', 'assets/audio/go-menu.m4a');
        if (!soundBuffers['come']) preloadSfx('come', 'assets/audio/come-menu.m4a');
        
        document.removeEventListener('mousemove', warmUpAudio);
        document.removeEventListener('click', warmUpAudio);
        document.removeEventListener('touchstart', warmUpAudio);
    }
    document.addEventListener('mousemove', warmUpAudio);
    document.addEventListener('click', warmUpAudio);
    document.addEventListener('touchstart', warmUpAudio);

    // Delegated hover sound logic for comets
    let lastHoveredComet = null;
    document.addEventListener('mouseover', (e) => {
        const comet = e.target.closest('.asteroid-module');
        if (comet && comet !== lastHoveredComet) {
            lastHoveredComet = comet;
            playSfx('hover');
        }
    });

    document.addEventListener('mouseout', (e) => {
        const comet = e.target.closest('.asteroid-module');
        if (comet && (!e.relatedTarget || !e.relatedTarget.closest('.asteroid-module') || e.relatedTarget.closest('.asteroid-module') !== comet)) {
            if (lastHoveredComet === comet) {
                lastHoveredComet = null;
            }
        }
    });

    // Delegated click listener for links and HUD audio button
    document.addEventListener('click', (e) => {
        // 1. Intercept local link navigations
        const link = e.target.closest('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                e.preventDefault();
                
                // If it's an asteroid navigation, trigger crumble disintegration and play select sound
                if (link.classList.contains('asteroid-module')) {
                    link.classList.add('crumble');
                    playSfx('go');
                }

                const targetUrl = link.href;
                window.SpaceTransitionManager.transitionTo(targetUrl, () => {
                    loadPageContent(targetUrl, true);
                });
                return;
            }
        }

        // 2. Intercept delegated sound effect mute button toggles
        const audioBtn = e.target.closest('.audio-btn');
        if (audioBtn) {
            toggleSfxMute();
        }
    });

    function toggleSfxMute() {
        isSfxMuted = !isSfxMuted;
        localStorage.setItem('cosmic-sfx-muted', isSfxMuted.toString());
        updateAudioButtonUI();
    }

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
        const targetUrl = window.location.href;
        window.SpaceTransitionManager.transitionTo(targetUrl, () => {
            loadPageContent(targetUrl, false);
        });
    });

    function loadPageContent(url, pushToHistory) {
        if (typeof cleanupCertificates3D === 'function') {
            cleanupCertificates3D();
            cleanupCertificates3D = null;
        }

        fetch(url)
            .then(res => res.text())
            .then(html => {
                const parser = new DOMParser();
                const newDoc = parser.parseFromString(html, 'text/html');

                // Swap central page container
                const currentContainer = document.querySelector('.hero-container');
                const newContainer = newDoc.querySelector('.hero-container');
                
                if (currentContainer && newContainer) {
                    currentContainer.className = newContainer.className;
                    currentContainer.innerHTML = newContainer.innerHTML;
                }

                // Update document title
                document.title = newDoc.title;

                // Sync HUD Audio Button state if present
                updateAudioButtonUI();

                // Push state to browser history
                if (pushToHistory) {
                    history.pushState(null, '', url);
                }

                // Focus accessibility
                if (currentContainer) {
                    currentContainer.focus();
                }

                // Trigger page-specific initializations
                initPageModules(url);
            })
            .catch(err => {
                console.error("PJAX load error:", err);
                window.location.href = url;
            });
    }

    let hasArrivedAtLeastOnce = false;
    function initPageModules(url) {
        const file = url.split('/').pop() || 'index.html';

        if (file === 'index.html' || file === '') {
            initHomeModule();
            if (hasArrivedAtLeastOnce) {
                playSfx('come');
            }
            hasArrivedAtLeastOnce = true;
        } else {
            hasArrivedAtLeastOnce = true;
            if (file === 'projects.html') {
                initProjectsModule();
            } else if (file === 'music.html') {
                initMusicModule();
            } else if (file === 'contact.html') {
                initContactModule();
            } else if (file === 'resume.html') {
                initResumeModule();
            } else if (file === 'certificates.html') {
                initCertificatesModule();
            }
        }
    }

    /* --- HOME PAGE MODULES --- */
    function initHomeModule() {
        if (window.initDriftingTechStars) {
            window.initDriftingTechStars();
        }
        console.log("Home page module loaded.");
    }

    // GPU-accelerated drifting tags
    window.initDriftingTechStars = function() {
        const stage = document.getElementById('physics-stage');
        if (!stage) return;
        
        stage.innerHTML = '';
        
        const techStarNames = [];//"Python", "C++", "MATLAB", "Arduino", "AI", "Docker", "HTML/CSS", "JS"
        const techBodies = [];

        techStarNames.forEach((name, i) => {
            const el = document.createElement('div');
            el.className = 'tech-star';
            el.textContent = name;
            stage.appendChild(el);
            
            const w = window.innerWidth;
            const h = window.innerHeight;
            const tx = Math.random() * (w - 180) + 90;
            const ty = Math.random() * (h - 180) + 90;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.45 + Math.random() * 0.45;
            
            techBodies.push({
                element: el,
                x: tx,
                y: ty,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                hovered: false
            });
            
            el.addEventListener('mouseenter', () => {
                techBodies[i].hovered = true;
            });
            
            el.addEventListener('mouseleave', () => {
                techBodies[i].hovered = false;
            });
        });

        function updateDrift() {
            const currentStage = document.getElementById('physics-stage');
            if (!currentStage) return;
            
            const w = window.innerWidth;
            const h = window.innerHeight;
            
            techBodies.forEach(star => {
                if (!star.hovered) {
                    star.x += star.vx;
                    star.y += star.vy;
                    
                    const elWidth = star.element.offsetWidth || 70;
                    const elHeight = star.element.offsetHeight || 30;
                    
                    if (star.x < 15) {
                        star.x = 15;
                        star.vx = Math.abs(star.vx);
                    }
                    if (star.x > w - elWidth - 15) {
                        star.x = w - elWidth - 15;
                        star.vx = -Math.abs(star.vx);
                    }
                    if (star.y < 15) {
                        star.y = 15;
                        star.vy = Math.abs(star.vy);
                    }
                    if (star.y > h - elHeight - 15) {
                        star.y = h - elHeight - 15;
                        star.vy = -Math.abs(star.vy);
                    }
                }
                
                star.element.style.transform = `translate3d(${star.x}px, ${star.y}px, 0)`;
            });
            
            requestAnimationFrame(updateDrift);
        }
        
        updateDrift();
    };

    /* --- PROJECTS Module --- */
    function initProjectsModule() {
        console.log("Projects module loaded.");
    }

    /* --- MUSIC RADIO PLAYER MODULE --- */
    let synthActive = false;
    let audioContext, oscillator, gainNode;

    function initMusicModule() {
        const playBtn = document.getElementById('radio-play');
        const stationLabel = document.getElementById('radio-station');
        const freqSlider = document.getElementById('radio-freq');

        if (!playBtn) return;

        playBtn.addEventListener('click', () => {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (synthActive) {
                if (oscillator) {
                    oscillator.stop();
                    oscillator.disconnect();
                }
                playBtn.textContent = 'PLAY RADIO';
                playBtn.classList.remove('playing');
                stationLabel.textContent = 'STATION: OFFLINE';
                synthActive = false;
            } else {
                oscillator = audioContext.createOscillator();
                gainNode = audioContext.createGain();

                oscillator.type = 'sawtooth';
                oscillator.frequency.value = parseFloat(freqSlider.value);
                
                const filter = audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 350;

                gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);

                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.start();
                playBtn.textContent = 'PAUSE RADIO';
                playBtn.classList.add('playing');
                stationLabel.textContent = `STATION: COSMIC HUM (${freqSlider.value} Hz)`;
                synthActive = true;
            }
        });

        if (freqSlider) {
            freqSlider.addEventListener('input', () => {
                if (oscillator && synthActive) {
                    oscillator.frequency.value = parseFloat(freqSlider.value);
                    stationLabel.textContent = `STATION: COSMIC HUM (${freqSlider.value} Hz)`;
                }
            });
        }
    }

    /* --- CONTACT TERMINAL MODULE --- */
    function initContactModule() {
        const input = document.getElementById('terminal-input');
        const output = document.getElementById('terminal-output');
        const form = document.getElementById('terminal-form');

        if (!input || !output) return;

        input.focus();
        document.addEventListener('click', () => {
            if (document.activeElement !== input && document.getElementById('terminal-input')) {
                input.focus();
            }
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const cmd = input.value.trim().toLowerCase();
                input.value = '';

                let reply = `\n> Guest: ${cmd}\n`;
                if (cmd === 'help') {
                    reply += `Available Commands:\n- about: Display developer intro\n- send: Send your message\n- clear: Clear the terminal logs`;
                } else if (cmd === 'about') {
                    reply += `AKSHAY SRINIVAS\nFull Stack Developer specializing in high-performance digital experiences.`;
                } else if (cmd === 'clear') {
                    output.textContent = 'Cosmic Terminal System [v1.0.8]\nType "help" to list available commands.';
                    return;
                } else if (cmd.startsWith('send ')) {
                    reply += `TRANSMISSION SUCCESSFUL: Your message has been sent into the deep stars!`;
                } else {
                    reply += `Command "${cmd}" not recognized. Type "help" for a list of valid terminal keys.`;
                }

                output.textContent += reply;
                output.scrollTop = output.scrollHeight;
            });
        }
    }

    /* --- RESUME MODULE --- */
    function initResumeModule() {
        console.log("Resume module loaded.");
    }

    /* --- CERTIFICATES 3D MODULE --- */
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function initCertificatesModule() {
        const promises = [];
        if (typeof THREE === 'undefined') {
            promises.push(loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"));
        }
        if (typeof gsap === 'undefined') {
            promises.push(loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"));
        }
        
        Promise.all(promises).then(() => {
            const subPromises = [];
            if (typeof THREE.GLTFLoader === 'undefined') {
                subPromises.push(loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"));
            }
            if (typeof THREE.OrbitControls === 'undefined') {
                subPromises.push(loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"));
            }
            return Promise.all(subPromises);
        }).then(() => {
            startCertificates3D();
        }).catch(err => {
            console.error("Error loading 3D dependencies:", err);
        });
    }

    let cleanupCertificates3D = null;

    function startCertificates3D() {
        const container = document.getElementById('three-canvas-container');
        if (!container) return;

        container.innerHTML = '';

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(2.5, 1.8, 4.2);

        function showStaticCardsFallback() {
            const cardContainer = document.getElementById("cardContainer");
            if (!cardContainer) return;
            cardContainer.innerHTML = '';
            
            const closeBtn = document.getElementById("closeButton");
            if (closeBtn) closeBtn.style.display = "none";
            
            const hint = document.getElementById("hint");
            if (hint) hint.style.display = "none";

            cardContainer.className = "static-fallback-grid";

            certificateData.forEach(cert => {
                const card = document.createElement("div");
                card.className = "card static-reveal " + cert.rarity;
                card.innerHTML = `
                    <div class="card-flipper" style="transform: rotateY(0deg);">
                        <div class="card-front">
                            <div class="card-image-wrapper">
                                <img class="card-cert-img" src="assets/images/cert-placeholder.png" alt="${cert.name}">
                                <div class="card-zoom-overlay">
                                    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                                </div>
                            </div>
                            <div class="card-info-pane">
                                <span class="card-issuer">${cert.issuer}</span>
                                <h3 class="card-title">${cert.name}</h3>
                                <p class="card-id">${cert.id}</p>
                                <span class="card-badge">${cert.rarity.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="card-back">
                            <div class="card-back-logo">TGNAS</div>
                        </div>
                    </div>
                `;

                const imgWrap = card.querySelector('.card-image-wrapper');
                if (imgWrap) {
                    imgWrap.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let lightbox = document.querySelector('.cert-lightbox');
                        if (!lightbox) {
                            lightbox = document.createElement('div');
                            lightbox.className = 'cert-lightbox';
                            lightbox.innerHTML = `
                                <div class="cert-lightbox-close">✕</div>
                                <div class="cert-lightbox-content">
                                    <img class="cert-lightbox-img" src="" alt="Certificate Preview">
                                    <h4 class="cert-lightbox-title"></h4>
                                </div>
                            `;
                            document.body.appendChild(lightbox);
                            
                            const closeLbox = lightbox.querySelector('.cert-lightbox-close');
                            closeLbox.addEventListener('click', () => {
                                playSfx('menu');
                                lightbox.classList.remove('active');
                            });
                            lightbox.addEventListener('click', (ev) => {
                                if (ev.target === lightbox) {
                                    playSfx('menu');
                                    lightbox.classList.remove('active');
                                }
                            });
                        }

                        playSfx('go');
                        const img = lightbox.querySelector('.cert-lightbox-img');
                        const title = lightbox.querySelector('.cert-lightbox-title');
                        img.src = "assets/images/cert-placeholder.png";
                        title.textContent = `${cert.issuer} - ${cert.name}`;
                        
                        lightbox.classList.add('active');
                    });
                }

                cardContainer.appendChild(card);
            });
        }

        let renderer;
        let controls;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.appendChild(renderer.domElement);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enablePan = false;
            controls.enableDamping = true;
            controls.target.set(0, 0.7, 0);
        } catch (err) {
            console.error("WebGL context creation failed:", err);
            showStaticCardsFallback();
            return;
        }

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 2);
        scene.add(ambient);

        const mainLight = new THREE.DirectionalLight(0xffffff, 6);
        mainLight.position.set(5, 10, 5);
        scene.add(mainLight);

        const rim = new THREE.DirectionalLight(0x66aaff, 4);
        rim.position.set(-5, 4, -5);
        scene.add(rim);

        const warm = new THREE.PointLight(0xffcc88, 8);
        warm.position.set(0, 4, 2);
        scene.add(warm);

        // Variables
        let chest = null;
        let latch = null;
        let mixer = null;
        let openAnim = null;
        let closeAnim = null;
        let opened = false;
        const cards = [];
        const clock = new THREE.Clock();
        let animationFrameId = null;

        const certificateData = [
            { name: "Cloud Operations", issuer: "AWS Academy", id: "AWS-78921-X9", rarity: "common" },
            { name: "Mobile Web Specialist", issuer: "Google Developers", id: "GOOG-FPS-60-A", rarity: "rare" },
            { name: "Machine Learning", issuer: "Stanford Online", id: "STAN-ML-3392", rarity: "epic" },
            { name: "Full Stack Developer", issuer: "Udacity Nano", id: "UDAC-FS-0082", rarity: "legendary" },
            { name: "AI Bot Architect", issuer: "Nvidia Deep Learning", id: "NVID-AI-4402", rarity: "epic" },
            { name: "Python Automation", issuer: "Python Institute", id: "PY-AUTO-9911", rarity: "common" },
            { name: "Cybersecurity Analyst", issuer: "CompTIA Security+", id: "SEC-9021-X", rarity: "rare" },
            { name: "ICPC Championship Medal", issuer: "ACM ICPC", id: "ICPC-MEDAL-2024", rarity: "legendary" }
        ];

        function createCards() {
            const cardContainer = document.getElementById("cardContainer");
            if (!cardContainer) return;
            cardContainer.innerHTML = '';
            cards.length = 0;

            certificateData.forEach(cert => {
                const card = document.createElement("div");
                card.className = "card " + cert.rarity;
                card.innerHTML = `
                    <div class="card-flipper">
                        <div class="card-front">
                            <div class="card-image-wrapper">
                                <img class="card-cert-img" src="assets/images/cert-placeholder.png" alt="${cert.name}">
                                <div class="card-zoom-overlay">
                                    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                                </div>
                            </div>
                            <div class="card-info-pane">
                                <span class="card-issuer">${cert.issuer}</span>
                                <h3 class="card-title">${cert.name}</h3>
                                <p class="card-id">${cert.id}</p>
                                <span class="card-badge">${cert.rarity.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="card-back">
                            <div class="card-back-logo">TGNAS</div>
                        </div>
                    </div>
                `;

                card.addEventListener('mouseenter', () => {
                    if (opened) {
                        playSfx('hover');
                    }
                });

                const imgWrap = card.querySelector('.card-image-wrapper');
                if (imgWrap) {
                    imgWrap.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let lightbox = document.querySelector('.cert-lightbox');
                        if (!lightbox) {
                            lightbox = document.createElement('div');
                            lightbox.className = 'cert-lightbox';
                            lightbox.innerHTML = `
                                <div class="cert-lightbox-close">✕</div>
                                <div class="cert-lightbox-content">
                                    <img class="cert-lightbox-img" src="" alt="Certificate Preview">
                                    <h4 class="cert-lightbox-title"></h4>
                                </div>
                            `;
                            document.body.appendChild(lightbox);
                            
                            const closeLbox = lightbox.querySelector('.cert-lightbox-close');
                            closeLbox.addEventListener('click', () => {
                                playSfx('menu');
                                lightbox.classList.remove('active');
                            });
                            lightbox.addEventListener('click', (ev) => {
                                if (ev.target === lightbox) {
                                    playSfx('menu');
                                    lightbox.classList.remove('active');
                                }
                            });
                        }

                        playSfx('go');
                        const img = lightbox.querySelector('.cert-lightbox-img');
                        const title = lightbox.querySelector('.cert-lightbox-title');
                        img.src = "assets/images/cert-placeholder.png";
                        title.textContent = `${cert.issuer} - ${cert.name}`;
                        
                        lightbox.classList.add('active');
                    });
                }

                cardContainer.appendChild(card);
                cards.push(card);
            });
        }

        let revealTimelines = [];

        function revealCards() {
            const closeBtn = document.getElementById("closeButton");
            if (closeBtn) closeBtn.style.display = "flex";

            const homeBtn = document.querySelector(".home-btn");
            if (homeBtn) homeBtn.style.display = "none";

            revealTimelines.forEach(t => t.kill());
            revealTimelines = [];
            cards.forEach(card => {
                gsap.killTweensOf(card);
                const flipper = card.querySelector('.card-flipper');
                if (flipper) {
                    gsap.killTweensOf(flipper);
                    gsap.set(flipper, { rotateY: 180 });
                }
            });

            const positions = [
                { x: 13, y: 22 }, { x: 37, y: 22 }, { x: 63, y: 22 }, { x: 87, y: 22 },
                { x: 13, y: 76 }, { x: 37, y: 76 }, { x: 63, y: 76 }, { x: 87, y: 76 }
            ];

            cards.forEach((card, index) => {
                const p = positions[index];
                const flipper = card.querySelector('.card-flipper');
                const tl = gsap.timeline({ delay: index * 0.22 });
                revealTimelines.push(tl);

                tl.fromTo(card,
                    { left: "50%", top: "58%", opacity: 0, scale: 0.1, x: 0, y: 0, rotation: 0 },
                    { opacity: 1, scale: 1.2, duration: 0.5 }
                )
                .to(card, {
                    left: p.x + "%",
                    top: p.y + "%",
                    scale: 1,
                    duration: 0.9,
                    ease: "back.out(1.4)"
                })
                .to(flipper, {
                    rotateY: 0,
                    duration: 0.6,
                    ease: "power2.out"
                });
            });
        }

        const loader = new THREE.GLTFLoader();
        loader.load(
            "3d/treasure_chest.glb",
            (gltf) => {
                chest = gltf.scene;
                chest.scale.set(0.95, 0.95, 0.95);
                scene.add(chest);

                mixer = new THREE.AnimationMixer(chest);

                openAnim = mixer.clipAction(
                    THREE.AnimationClip.findByName(gltf.animations, "chest_rig|chest_open_anim")
                );
                closeAnim = mixer.clipAction(
                    THREE.AnimationClip.findByName(gltf.animations, "chest_rig|chest_close_anim")
                );

                [openAnim, closeAnim].forEach(a => {
                    if (a) {
                        a.setLoop(THREE.LoopOnce);
                        a.clampWhenFinished = true;
                    }
                });

                chest.traverse((obj) => {
                    if (obj.name === "chest_latch") {
                        latch = obj;
                    }
                });

                createCards();
            },
            undefined,
            (err) => {
                console.error("GLTF load error:", err);
            }
        );

        let isDragging = false;
        let startX = 0, startY = 0;

        function onMouseDown(e) {
            startX = e.clientX;
            startY = e.clientY;
            isDragging = false;
        }

        function onMouseUp(e) {
            const diffX = Math.abs(e.clientX - startX);
            const diffY = Math.abs(e.clientY - startY);
            if (diffX > 6 || diffY > 6) {
                isDragging = true;
            }
        }

        function onClick(event) {
            if (opened || isDragging) return;

            if (event.target.closest('.hud-btn') || event.target.closest('#closeButton')) return;

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                openChest();
            }
        }

        function openChest() {
            if (opened) return;
            opened = true;

            playSfx('go');

            const hint = document.getElementById("hint");
            if (hint) hint.style.display = "none";

            const homeBtn = document.querySelector(".home-btn");
            if (homeBtn) homeBtn.style.display = "none";

            if (closeAnim) closeAnim.stop();
            if (openAnim) {
                openAnim.reset();
                openAnim.play();
            }

            setTimeout(() => {
                if (latch) latch.visible = false;
            }, 300);

            setTimeout(() => {
                revealCards();
            }, 900);
        }

        const closeBtn = document.getElementById("closeButton");
        if (closeBtn) {
            closeBtn.onclick = () => {
                closeBtn.style.display = "none";

                revealTimelines.forEach(t => t.kill());
                revealTimelines = [];

                cards.forEach((card, index) => {
                    gsap.killTweensOf(card);
                    const flipper = card.querySelector('.card-flipper');
                    if (flipper) gsap.killTweensOf(flipper);

                    gsap.to(card, {
                        x: Math.random() * 1600 - 800,
                        y: Math.random() * 1000 - 500,
                        rotation: Math.random() * 720,
                        scale: 0,
                        opacity: 0,
                        duration: 0.8,
                        delay: index * 0.02,
                        ease: "power4.out"
                    });
                });

                setTimeout(() => {
                    if (latch) latch.visible = true;

                    if (openAnim) openAnim.stop();
                    if (closeAnim) {
                        closeAnim.reset();
                        closeAnim.play();
                    }
                    opened = false;

                    cards.forEach(card => {
                        gsap.killTweensOf(card);
                        const flipper = card.querySelector('.card-flipper');
                        if (flipper) gsap.killTweensOf(flipper);

                        gsap.set(card, { clearProps: "all" });
                        card.style.opacity = 0;
                        if (flipper) gsap.set(flipper, { rotateY: 180 });
                    });

                    const hint = document.getElementById("hint");
                    if (hint) hint.style.display = "block";

                    const homeBtn = document.querySelector(".home-btn");
                    if (homeBtn) homeBtn.style.display = "flex";
                }, 1100);
            };
        }

        function animate() {
            animationFrameId = requestAnimationFrame(animate);

            if (mixer) {
                mixer.update(clock.getDelta());
            }

            if (latch && opened) {
                latch.visible = false;
            }

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        let chestHovered = false;
        function onMouseMove(event) {
            if (opened) {
                document.body.style.cursor = 'default';
                return;
            }

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                document.body.style.cursor = 'pointer';
                if (!chestHovered) {
                    chestHovered = true;
                    playSfx('hover');
                }
            } else {
                document.body.style.cursor = 'default';
                chestHovered = false;
            }
        }

        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('click', onClick);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('resize', onResize);

        cleanupCertificates3D = () => {
            cancelAnimationFrame(animationFrameId);
            document.body.style.cursor = 'default';
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('click', onClick);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onResize);

            if (controls) {
                try { controls.dispose(); } catch (e) {}
            }
            if (renderer) {
                try {
                    renderer.forceContextLoss();
                    renderer.dispose();
                } catch (e) {}
                if (renderer.domElement && renderer.domElement.parentNode) {
                    renderer.domElement.parentNode.removeChild(renderer.domElement);
                }
            }

            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });

            revealTimelines.forEach(t => t.kill());
            revealTimelines = [];
            cards.forEach(card => gsap.killTweensOf(card));

            const lightbox = document.querySelector('.cert-lightbox');
            if (lightbox) lightbox.remove();
        };
    }

    function createSoundConsentModal() {
        const overlay = document.createElement('div');
        overlay.id = 'sound-modal-overlay';
        overlay.className = 'sound-modal-overlay';
        overlay.innerHTML = `
            <div class="sound-modal glass-panel">
                <h3 class="sound-modal-title">SYSTEM PROMPT</h3>
                <p class="sound-modal-text">This is TGNAS's portfolio website. This dialogue box is to enable sound effects, which browsers block by default.</p>
                <div class="sound-modal-options">
                    <button class="sound-modal-btn opt-fallback">1. Follow no 2</button>
                    <button class="sound-modal-btn opt-accept">2. Accept</button>
                    <button class="sound-modal-btn opt-fallback">3. Follow no 2</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const btns = overlay.querySelectorAll('.sound-modal-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                sessionStorage.setItem('cosmic-sound-unlocked', 'true');
                
                // Warm up context and play sweep
                initSfxContext();
                playSfx('go');
                
                // Trigger page liquid splash transition to reveal dashboard
                if (window.SpaceTransitionManager) {
                    window.SpaceTransitionManager.transitionTo(window.location.href, () => {
                        overlay.remove();
                    });
                } else {
                    overlay.remove();
                }
            });
        });
    }

    // Run first initialization immediately, avoiding DOMContentLoaded race conditions on direct refresh
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            initPageModules(window.location.href);
            updateAudioButtonUI();
            if (!sessionStorage.getItem('cosmic-sound-unlocked')) {
                createSoundConsentModal();
            }
        });
    } else {
        initPageModules(window.location.href);
        updateAudioButtonUI();
        if (!sessionStorage.getItem('cosmic-sound-unlocked')) {
            createSoundConsentModal();
        }
    }
})();
