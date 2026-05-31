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
    preloadSfx('chest_open', 'assets/audio/subway-surfers-open-box.mp3');
    preloadSfx('chest_close', 'assets/audio/Chest_close.mp3');

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
                } else if (name === 'chest_open') {
                    // Loot blip sweep
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(260, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                    osc.start(now);
                    osc.stop(now + 0.7);
                } else if (name === 'chest_close') {
                    // Low rumble slam slam
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                    osc.start(now);
                    osc.stop(now + 0.65);
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
        if (!soundBuffers['chest_open']) preloadSfx('chest_open', 'assets/audio/subway-surfers-open-box.mp3');
        if (!soundBuffers['chest_close']) preloadSfx('chest_close', 'assets/audio/Chest_close.mp3');
        
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
        if (window.initProjects) {
            window.initProjects();
        } else {
            const script = document.createElement('script');
            script.src = 'js/projects.js';
            script.onload = () => {
                if (window.initProjects) {
                    window.initProjects();
                }
            };
            document.body.appendChild(script);
        }
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

        const categories = {
            events: [
                {
                    name: "Accurate Service Locator",
                    issuer: "Vendor Discoverability App",
                    id: "EVT-ASL-2024",
                    rarity: "rare",
                    desc: "Developed a mobile application concept that helps users discover and interact with unlisted local vendors and roadside stalls using GPS, voice, text, and camera-based search, promoting small businesses and community growth.",
                    images: [
                        "assets/event-assets/Accurate-service-locator/certificate-asme.png",
                        "assets/event-assets/Accurate-service-locator/image1.png",
                        "assets/event-assets/Accurate-service-locator/image2.png",
                        "assets/event-assets/Accurate-service-locator/image3.png"
                    ]
                },
                {
                    name: "Atomquest 2024",
                    issuer: "Atomberg",
                    id: "EVT-AQ-2024",
                    rarity: "epic",
                    desc: "Designed an ESP32-based centralized control system that bridges smart and non-smart appliances, enabling seamless control of lights, fans, outlets, and other devices through a single multifunctional knob with Wi-Fi connectivity.",
                    images: [
                        "assets/event-assets/atomquest-2024/Atomquest_2024_certificate.jpg",
                        "assets/event-assets/atomquest-2024/image1.png"
                    ]
                },
                {
                    name: "Pentathon CTF 2025",
                    issuer: "Team Gix Notion",
                    id: "EVT-PCTF-2025",
                    rarity: "legendary",
                    desc: "Secured 46th place out of 3,524+ teams worldwide (Top 1.31%) in a 48-hour cybersecurity competition, solving challenges across Web Exploitation, Forensics, Reverse Engineering, and Miscellaneous categories as part of Team Gix Notion.",
                    images: [
                        "assets/event-assets/pentathon-2025/image1.jpg"
                    ]
                },
                {
                    name: "Thiran 2024 - Smart Emergency Speed Breaker System",
                    issuer: "Thiran IoT Exhibition",
                    id: "EVT-THI-2024",
                    rarity: "epic",
                    desc: "Developed an embedded IoT solution that uses authenticated wireless communication and a hydraulic retractable speed breaker to provide uninterrupted passage for emergency vehicles while maintaining public safety through automated alerts and fail-safe mechanisms.",
                    images: [
                        "assets/event-assets/thiran-2025/banner.jpg",
                        "assets/event-assets/thiran-2025/image1.jpg"
                    ]
                },
                {
                    name: "Shine Healthcare Hackathon 2025",
                    issuer: "Bongos Therapy for Autism Children",
                    id: "EVT-SHH-2025",
                    rarity: "rare",
                    desc: "Developed and presented an interactive therapy system for children with autism at the Shine Healthcare Hackathon 2025, advancing from ~1500 teams to the Top 350 and showcasing a functional prototype at the regional pre-finale.",
                    images: [
                        "assets/event-assets/shine-health-care-hackathon/image1.png",
                        "assets/event-assets/shine-health-care-hackathon/image2.jpeg"
                    ]
                },
                {
                    name: "SIH 2025 - Internal Round (2nd Place)",
                    issuer: "AI-Powered Timetable Management System",
                    id: "EVT-SIH-2025",
                    rarity: "rare",
                    desc: "Developed a smart scheduling platform that automatically generates conflict-free academic timetables by considering faculty availability, room constraints, internships, and NEP activities, with customizable scheduling and multi-view timetable management.",
                    images: [
                        "assets/event-assets/SIH-2025-internal/image0.jpeg",
                        "assets/event-assets/SIH-2025-internal/image1.png",
                        "assets/event-assets/SIH-2025-internal/image2.png",
                        "assets/event-assets/SIH-2025-internal/image3.png",
                        "assets/event-assets/SIH-2025-internal/image4.png"
                    ]
                },
                {
                    name: "WYF Dr. Kalam Awards 2025",
                    issuer: "World Youth Federation",
                    id: "EVT-DKA-2025",
                    rarity: "epic",
                    desc: "Shortlisted for the World Youth Federation (WYF) Dr. Kalam Awards 2025, presenting an innovative project among talented teams and gaining recognition for technical creativity and impact.",
                    images: [
                        "assets/event-assets/world-youth-federation/image1.png"
                    ]
                },
                {
                    name: "Bharatiya Antariksh Hackathon 2025",
                    issuer: "Knowledge Graph–Enhanced AI Chatbot",
                    id: "EVT-BAH-2025",
                    rarity: "legendary",
                    desc: "Built an AI assistant combining LLMs, RAG, Knowledge Graphs, and ontology-based reasoning to deliver accurate, context-aware responses with real-time intent detection, adaptive learning, and dynamic visual content generation.",
                    images: [
                        "assets/event-assets/isro-hackathon/certificate.png",
                        "assets/event-assets/isro-hackathon/image1.png",
                        "assets/event-assets/isro-hackathon/KG-demo.png"
                    ]
                },
                {
                    name: "Moodmate - Emotion-Aware AI Assistant",
                    issuer: "Sankalp 101",
                    id: "EVT-MM-2025",
                    rarity: "rare",
                    desc: "Proposed an AI system that adapts content and recommendations based on users’ emotional states, enabling personalized, empathetic interactions to improve focus, well-being, and overall user experience.",
                    images: [
                        "assets/event-assets/moodmate/inage1.jpeg",
                        "assets/event-assets/moodmate/image2.jpeg"
                    ]
                },
                {
                    name: "Statathon 2025 Govt",
                    issuer: "AI-Powered Occupational Classification System",
                    id: "EVT-STA-2025",
                    rarity: "epic",
                    desc: "Developed a semantic search and data quality enhancement platform that uses NLP and machine learning to automatically classify free-text job descriptions into NCO codes, improving survey accuracy and reducing manual effort.",
                    images: [
                        "assets/event-assets/statathon-2025/image1.png",
                        "assets/event-assets/statathon-2025/image2.png"
                    ]
                },
                {
                    name: "IIC Regional Meet 2025",
                    issuer: "Ministry of Education Innovation Cell",
                    id: "EVT-IIC-2025",
                    rarity: "common",
                    desc: "Shortlisted to present a project at the IIC Regional Meet 2025, gaining valuable feedback from industry experts and engaging with innovators, entrepreneurs, and startup-focused communities.",
                    images: [
                        "assets/event-assets/iic-regional-meet-psg/certificate.jpg",
                        "assets/event-assets/iic-regional-meet-psg/image1.jpeg"
                    ]
                },
                {
                    name: "Microsoft M365 Developer Event",
                    issuer: "Microsoft Ecosystem",
                    id: "EVT-MS-2025",
                    rarity: "common",
                    desc: "Attended a Microsoft ecosystem event that highlighted the challenges of building scalable, production-ready software, reinforcing the importance of solving real-world problems beyond local development and prototypes.",
                    images: [
                        "assets/event-assets/M365/image1.jpeg"
                    ]
                },
                {
                    name: "Google Cloud AI Series",
                    issuer: "Google Cloud Ecosystem",
                    id: "EVT-GC-2025",
                    rarity: "common",
                    desc: "Attended a hands-on AI workshop focused on AI agents, agent workflows, and Gemini CLI, gaining practical insights into modern cloud-based AI development and deployment.",
                    images: [
                        "assets/event-assets/google-ai-labs/image1.jpeg"
                    ]
                },
                {
                    name: "SRCAS Hackathon 2.0",
                    issuer: "AI-Powered Cybercrime Assistance Platform",
                    id: "EVT-SRCAS-2.0",
                    rarity: "epic",
                    desc: "Developed a RAG-based web platform that helps cybercrime victims identify incidents, analyze evidence, and receive guidance aligned with Indian Cybercrime SOPs using LLMs, multimodal AI, voice input, and secure evidence handling.",
                    images: [
                        "assets/event-assets/srcas-2.0/certificate.jpeg",
                        "assets/event-assets/srcas-2.0/image1.png",
                        "assets/event-assets/srcas-2.0/image2.png"
                    ]
                },
                {
                    name: "AI-Powered Vulnerability Audit Generator",
                    issuer: "Global Israel Ariel Hackathon",
                    id: "EVT-ARIEL-2026",
                    rarity: "legendary",
                    desc: "Developed a secure application that analyzes vulnerability reports using a locally hosted LLM, automatically generating professional audit reports with risk assessments, severity classification, remediation recommendations, and PDF export while preserving data privacy.",
                    images: [
                        "assets/event-assets/ariel-iseral-international-hackathon/ariel-hackathon-2025-final-round.png",
                        "assets/event-assets/ariel-iseral-international-hackathon/srec-ariel-hackathon.png"
                    ]
                },
                {
                    name: "AI Agent-Based Phone Number Validation API",
                    issuer: "Thiran 2026 Finalist",
                    id: "EVT-THI-2026",
                    rarity: "legendary",
                    desc: "Developed an agentic AI middleware that validates bulk phone numbers before message delivery, helping organizations reduce communication costs by filtering invalid contacts through an intelligent multi-agent decision-making workflow.",
                    images: [
                        "assets/event-assets/thiran-2026/image1.jpeg",
                        "assets/event-assets/thiran-2026/image2.jpeg"
                    ]
                },
                {
                    name: "NIT Trichy DSA Workshop",
                    issuer: "NIT Trichy",
                    id: "EVT-NIT-2025",
                    rarity: "common",
                    desc: "Attended a Data Structures and Algorithms workshop at NIT Trichy, gaining practical insights into problem-solving, algorithmic thinking, and real-world applications of core computer science concepts.",
                    images: [
                        "assets/event-assets/nit-trichy/certificate.png",
                        "assets/event-assets/nit-trichy/image1.jpeg"
                    ]
                },
                {
                    name: "Inno Blitz",
                    issuer: "Sri Ramakrishna Engineering College",
                    id: "EVT-IB-2025",
                    rarity: "rare",
                    desc: "Secured 3rd place with a cash prize for an IoT project developed and presented at Sri Ramakrishna Engineering College.",
                    images: [
                        "assets/event-assets/inno-blitz/image1.png"
                    ]
                },
                {
                    name: "Atomquest 2025",
                    issuer: "Autonomous Robotic Cleaning Bot",
                    id: "EVT-AQ-2025",
                    rarity: "epic",
                    desc: "Proposed an intelligent cleaning robot capable of navigating obstacle-filled environments and efficiently collecting diverse dry waste using integrated cleaning mechanisms, sensors, and autonomous path-planning.",
                    images: [
                        "assets/event-assets/atomquest-2025/image1.png"
                    ]
                },
                {
                    name: "SAP Hackfest 2025",
                    issuer: "Ethical AI Resume Analysis Platform",
                    id: "EVT-SAP-2025",
                    rarity: "legendary",
                    desc: "Reached the final round for developing an explainable AI system that provides fair, privacy-preserving resume feedback using LLMs and XAI techniques, ensuring transparent recommendations while mitigating bias in hiring.",
                    images: [
                        "assets/event-assets/sap-hackfest/image1.jpeg",
                        "assets/event-assets/sap-hackfest/image2.jpeg"
                    ]
                },
                {
                    name: "ACM ICPC Selection Attempt",
                    issuer: "ACM ICPC First Year",
                    id: "EVT-ICPC-2023",
                    rarity: "common",
                    desc: "Participated in ACM ICPC regional selection during the first year of college. Experienced rigorous competitive programming challenges and advanced algorithms under time pressure.",
                    image: "assets/images/cert-placeholder.png"
                },
                {
                    name: "RTX AI PC Day 2025",
                    issuer: "NVIDIA RTX AI PC",
                    id: "EVT-RTX-2025",
                    rarity: "common",
                    desc: "Explored emerging AI PC technologies, gaming hardware, and creator-focused workflows through hands-on demonstrations, industry showcases, and community interactions at NVIDIA's RTX AI PC Day event.",
                    images: [
                        "assets/event-assets/nvidia-rtx-event/image2.jpeg"
                    ]
                }
            ],
            certificates: [
                {
                    name: "C Programming Training",
                    issuer: "IIT Bombay Spoken Tutorial",
                    id: "CERT-IITB-C",
                    rarity: "common",
                    highlight: "Credits: 2",
                    desc: "Awarded for the successful completion of C language programming training, verified by IIT Bombay Spoken Tutorial program.",
                    image: "assets/certificates/iit-b-c.png"
                },
                {
                    name: "C++ Programming Training",
                    issuer: "IIT Bombay Spoken Tutorial",
                    id: "CERT-IITB-CPP",
                    rarity: "common",
                    highlight: "Credits: 2",
                    desc: "Awarded for the successful completion of C++ language programming training, verified by IIT Bombay Spoken Tutorial program.",
                    image: "assets/certificates/iit-b-cpp.png"
                },
                {
                    name: "Python 3.4.3 Training",
                    issuer: "IIT Bombay Spoken Tutorial",
                    id: "CERT-IITB-PY",
                    rarity: "common",
                    highlight: "Credits: 2",
                    desc: "Awarded for the successful completion of Python 3.4.3 programming training, verified by IIT Bombay Spoken Tutorial program.",
                    image: "assets/certificates/iit-b-python.png"
                },
                {
                    name: "Design Thinking - A Primer",
                    issuer: "NPTEL",
                    id: "CERT-NPTEL-DT",
                    rarity: "rare",
                    highlight: "Score: 78% (Elite + Silver, Credit: 1)",
                    desc: "Completed the certification course on Design Thinking - A Primer with a final score of 78%, earning an Elite + Silver badge and 1 academic credit.",
                    image: "assets/certificates/nptel-designer-thinking.png"
                },
                {
                    name: "Introduction to Internet of Things",
                    issuer: "NPTEL",
                    id: "CERT-NPTEL-IOT",
                    rarity: "epic",
                    highlight: "Score: 75% (Elite + Silver, Credits: 4)",
                    desc: "Completed the certification course on Introduction to Internet of Things with a final score of 75%, earning an Elite + Silver badge and 4 academic credits.",
                    image: "assets/certificates/nptel-iot.png"
                },
                {
                    name: "Introduction to AI Concepts",
                    issuer: "Microsoft Azure",
                    id: "CERT-MS-AI",
                    rarity: "rare",
                    highlight: "Azure Certified",
                    desc: "Successfully completed training on fundamental AI concepts, cloud environments, and intelligent system architectures on Microsoft Azure.",
                    image: "assets/certificates/Microsoft-azure-batch.png"
                },
                {
                    name: "Basics of Python",
                    issuer: "Infosys Springboard",
                    id: "CERT-INFY-PY",
                    rarity: "common",
                    highlight: "Infosys Verified",
                    desc: "Acquired fundamental knowledge of Python programming, data types, object-oriented concepts, and basic data structures.",
                    image: "assets/certificates/infosis-python.png"
                },
                {
                    name: "Full-Stack Development",
                    issuer: "SkillUp",
                    id: "CERT-SKILLUP-FS",
                    rarity: "epic",
                    highlight: "Professional Course",
                    desc: "Completed full-stack engineering training covering front-end and back-end integration, database modeling, and server-side deployment.",
                    image: "assets/certificates/skillshare-fullstack.png"
                },
                {
                    name: "MATLAB Onramp",
                    issuer: "MathWorks",
                    id: "CERT-MAT-ONRAMP",
                    rarity: "common",
                    highlight: "MathWorks Certified",
                    desc: "Completed introductory training on MATLAB variables, syntax, data visualization, and scripting pipelines.",
                    image: "assets/certificates/matlab-onramp.jpg"
                },
                {
                    name: "MATLAB for Statics Data",
                    issuer: "MathWorks",
                    id: "CERT-MAT-STATICS",
                    rarity: "rare",
                    highlight: "Data Science",
                    desc: "Completed MathWorks certification on applying MATLAB routines for statistical analysis, structural statics data modeling, and mathematical calculations.",
                    image: "assets/certificates/matlab-2nd.png"
                }
            ],
            achievements: [
                {
                    name: "Atomquest 2024",
                    issuer: "Atomberg",
                    id: "ACH-AQ-2024",
                    rarity: "epic",
                    highlight: "Finalist - All India",
                    desc: "Designed an ESP32-based centralized control system that bridges smart and non-smart appliances, enabling seamless control of lights, fans, outlets, and other devices through a single multifunctional knob with Wi-Fi connectivity.",
                    images: [
                        "assets/event-assets/atomquest-2024/Atomquest_2024_certificate.jpg",
                        "assets/event-assets/atomquest-2024/image1.png"
                    ]
                },
                {
                    name: "Pentathon CTF 2025",
                    issuer: "Team Gix Notion",
                    id: "ACH-PCTF-2025",
                    rarity: "legendary",
                    highlight: "46th Place Worldwide (Top 1.31%)",
                    desc: "Secured 46th place out of 3,524+ teams worldwide in a 48-hour cybersecurity competition, solving challenges across Web Exploitation, Forensics, Reverse Engineering, and Miscellaneous categories.",
                    images: [
                        "assets/event-assets/pentathon-2025/image1.jpg"
                    ]
                },
                {
                    name: "Shine Healthcare Hackathon 2025",
                    issuer: "Bongos Therapy for Autism Children",
                    id: "ACH-SHH-2025",
                    rarity: "rare",
                    highlight: "Top 350 Finalist",
                    desc: "Developed and presented an interactive therapy system for children with autism at the Shine Healthcare Hackathon 2025, advancing from ~1500 teams to the Top 350 and showcasing a functional prototype at the regional pre-finale.",
                    images: [
                        "assets/event-assets/shine-health-care-hackathon/image1.png",
                        "assets/event-assets/shine-health-care-hackathon/image2.jpeg"
                    ]
                },
                {
                    name: "SIH 2025 - Internal Round",
                    issuer: "AI-Powered Timetable Management System",
                    id: "ACH-SIH-2025",
                    rarity: "rare",
                    highlight: "2nd Place",
                    desc: "Developed a smart scheduling platform that automatically generates conflict-free academic timetables by considering faculty availability, room constraints, internships, and NEP activities, with customizable scheduling and multi-view timetable management.",
                    images: [
                        "assets/event-assets/SIH-2025-internal/image0.jpeg",
                        "assets/event-assets/SIH-2025-internal/image1.png",
                        "assets/event-assets/SIH-2025-internal/image2.png",
                        "assets/event-assets/SIH-2025-internal/image3.png",
                        "assets/event-assets/SIH-2025-internal/image4.png"
                    ]
                },
                {
                    name: "WYF Dr. Kalam Awards 2025",
                    issuer: "World Youth Federation",
                    id: "ACH-DKA-2025",
                    rarity: "epic",
                    highlight: "Shortlisted",
                    desc: "Shortlisted for the World Youth Federation (WYF) Dr. Kalam Awards 2025, presenting an innovative project among talented teams and gaining recognition for technical creativity and impact.",
                    images: [
                        "assets/event-assets/world-youth-federation/image1.png"
                    ]
                },
                {
                    name: "IIC Regional Meet 2025",
                    issuer: "Ministry of Education Innovation Cell",
                    id: "ACH-IIC-2025",
                    rarity: "common",
                    highlight: "National Selection - Top 3000",
                    desc: "Shortlisted to present a project at the IIC Regional Meet 2025, gaining valuable feedback from industry experts and engaging with innovators, entrepreneurs, and startup-focused communities. Selected in Top 3000 out of 14,000+ teams.",
                    images: [
                        "assets/event-assets/iic-regional-meet-psg/certificate.jpg",
                        "assets/event-assets/iic-regional-meet-psg/image1.jpeg"
                    ]
                },
                {
                    name: "SRCAS Hackathon 2.0",
                    issuer: "AI-Powered Cybercrime Assistance Platform",
                    id: "ACH-SRCAS-2025",
                    rarity: "epic",
                    highlight: "Top 10 Finalist",
                    desc: "Developed a RAG-based web platform that helps cybercrime victims identify incidents, analyze evidence, and receive guidance aligned with Indian Cybercrime SOPs using LLMs, multimodal AI, voice input, and secure evidence handling. Ranked top 10 out of 100 teams of 3.",
                    images: [
                        "assets/event-assets/srcas-2.0/certificate.jpeg",
                        "assets/event-assets/srcas-2.0/image1.png",
                        "assets/event-assets/srcas-2.0/image2.png"
                    ]
                },
                {
                    name: "Global Israel Ariel Hackathon",
                    issuer: "AI-Powered Vulnerability Audit Generator",
                    id: "ACH-ARIEL-2026",
                    rarity: "legendary",
                    highlight: "International Finalist",
                    desc: "Developed a secure application that analyzes vulnerability reports using a locally hosted LLM, automatically generating professional audit reports with risk assessments, severity classification, remediation recommendations, and PDF export while preserving data privacy.",
                    images: [
                        "assets/event-assets/ariel-iseral-international-hackathon/ariel-hackathon-2025-final-round.png",
                        "assets/event-assets/ariel-iseral-international-hackathon/srec-ariel-hackathon.png"
                    ]
                },
                {
                    name: "Thiran 2026",
                    issuer: "AI Agent-Based Phone Validation API",
                    id: "ACH-THI-2026",
                    rarity: "legendary",
                    highlight: "Finalist",
                    desc: "Developed an agentic AI middleware that validates bulk phone numbers before message delivery, helping organizations reduce communication costs by filtering invalid contacts through an intelligent multi-agent decision-making workflow.",
                    images: [
                        "assets/event-assets/thiran-2026/image1.jpeg",
                        "assets/event-assets/thiran-2026/image2.jpeg"
                    ]
                },
                {
                    name: "Inno Blitz Hackathon",
                    issuer: "Sri Ramakrishna Engineering College",
                    id: "ACH-IB-2025",
                    rarity: "rare",
                    highlight: "3rd Place - Cash Prize",
                    desc: "Secured 3rd place with a cash prize for an innovative IoT project designed and prototyped during the Inno Blitz event at Sri Ramakrishna Engineering College.",
                    images: [
                        "assets/event-assets/inno-blitz/image1.png"
                    ]
                },
                {
                    name: "SAP Hackfest 2025",
                    issuer: "Ethical AI Resume Analysis Platform",
                    id: "ACH-SAP-2025",
                    rarity: "legendary",
                    highlight: "Final Round Finalist",
                    desc: "Reached the final round at SAP Hackfest 2025. Developed an explainable AI system that provides fair, privacy-preserving resume feedback using LLMs and XAI techniques, ensuring transparent recommendations while mitigating bias in hiring.",
                    images: [
                        "assets/event-assets/sap-hackfest/image1.jpeg",
                        "assets/event-assets/sap-hackfest/image2.jpeg"
                    ]
                }
            ]
        };

        const categoryCardsData = [
            { id: "certificates", name: "Certificates", description: "Official Course Completions & Academics", rarity: "epic" },
            { id: "achievements", name: "Achievements", description: "Bronze Medals, Project Awards, Milestones", rarity: "legendary" },
            { id: "events", name: "Events", description: "Hackathons, Workshops, Speaking Engagements", rarity: "rare" }
        ];

        function showStaticCardsFallback() {
            const cardContainer = document.getElementById("cardContainer");
            if (!cardContainer) return;
            cardContainer.innerHTML = '';
            
            const closeBtn = document.getElementById("closeButton");
            if (closeBtn) closeBtn.style.display = "none";
            
            const hint = document.getElementById("hint");
            if (hint) hint.style.display = "none";

            cardContainer.className = "static-fallback-grid";

            categoryCardsData.forEach(cat => {
                const card = document.createElement("div");
                card.className = "card category-card static-reveal " + cat.rarity;
                card.innerHTML = `
                    <div class="card-flipper" style="transform: rotateY(0deg);">
                        <div class="card-front">
                            <span class="card-issuer">Achievements Folder</span>
                            <h3 class="card-title">${cat.name}</h3>
                            <p class="card-desc">${cat.description}</p>
                            <span class="card-badge">${cat.rarity.toUpperCase()}</span>
                        </div>
                    </div>
                `;

                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openCategoryListSpace(cat.id);
                });

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
        let isRenderPaused = false;

        function createCards() {
            const cardContainer = document.getElementById("cardContainer");
            if (!cardContainer) return;
            cardContainer.innerHTML = '';
            cards.length = 0;

            categoryCardsData.forEach(cat => {
                const card = document.createElement("div");
                card.className = "card category-card " + cat.rarity;
                card.dataset.categoryId = cat.id;
                card.innerHTML = `
                    <div class="card-flipper">
                        <div class="card-front">
                            <span class="card-issuer">Achievements Folder</span>
                            <h3 class="card-title">${cat.name}</h3>
                            <p class="card-desc">${cat.description}</p>
                            <span class="card-badge">${cat.rarity.toUpperCase()}</span>
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

                card.addEventListener('click', (e) => {
                    if (!opened) return;
                    e.stopPropagation();
                    openCategoryListSpace(cat.id);
                });

                cardContainer.appendChild(card);
                cards.push(card);
            });
        }

        function openCategoryListSpace(catId) {
            playSfx('go');
            isRenderPaused = true;
            
            const isMobile = window.innerWidth <= 900;
            let overlay = document.querySelector('.category-list-space');
            if (overlay) {
                overlay.parentNode.removeChild(overlay);
            }

            overlay = document.createElement('div');
            overlay.className = 'category-list-space';
            overlay.dataset.catId = catId;

            const items = categories[catId] || [];

            if (isMobile) {
                // Mobile Reels / Shorts Layout
                let slidesHTML = '';
                const N = items.length;
                
                // Render 3 copies of items for seamless infinite looping scroll
                for (let copy = 0; copy < 3; copy++) {
                    items.forEach((item, index) => {
                        const globalIndex = copy * N + index;
                        let images = [];
                        if (Array.isArray(item.images)) {
                            images = item.images;
                        } else if (item.image) {
                            images = [item.image];
                        } else {
                            images = ["assets/images/cert-placeholder.png"];
                        }

                        let slideImagesHTML = '';
                        images.forEach((imgUrl, idx) => {
                            slideImagesHTML += `<img src="${imgUrl}" class="${idx === 0 ? 'active' : ''}" alt="${item.name}">`;
                        });

                        const highlightHTML = item.highlight ? `<span class="shorts-highlight">${item.highlight}</span>` : '';
                        slidesHTML += `
                            <div class="mobile-shorts-slide" data-index="${index}" data-global-index="${globalIndex}">
                                <div class="shorts-image-wrapper">
                                    <div class="shorts-slides-container">
                                        ${slideImagesHTML}
                                    </div>
                                    <button class="shorts-arrow arrow-left">‹</button>
                                    <button class="shorts-arrow arrow-right">›</button>
                                    <div class="shorts-like-heart-icon">🤍</div>
                                    <div class="instagram-heart">❤️</div>
                                </div>
                                <div class="shorts-info-pane">
                                    <div class="shorts-issuer-row">
                                        <span class="shorts-issuer">${item.issuer}</span>
                                        ${highlightHTML}
                                    </div>
                                    <h2 class="shorts-title">${item.name}</h2>
                                    <p class="shorts-desc">${item.desc}</p>
                                    <span class="shorts-id">Cred ID: ${item.id}</span>
                                </div>
                            </div>
                        `;
                    });
                }

                let menuItemsHTML = '';
                items.forEach((item, index) => {
                    const thumbImg = Array.isArray(item.images) ? item.images[0] : (item.image || "assets/images/cert-placeholder.png");
                    menuItemsHTML += `
                        <div class="mobile-menu-item-card ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <div class="mobile-menu-thumb">
                                <img src="${thumbImg}" alt="${item.name}">
                            </div>
                            <div class="mobile-menu-meta">
                                <span class="mobile-menu-issuer">${item.issuer}</span>
                                <h4 class="mobile-menu-item-title">${item.name}</h4>
                            </div>
                        </div>
                    `;
                });

                const prettyCatName = catId === 'events' ? 'Events' : (catId === 'achievements' ? 'Achievements' : 'Certificates');

                overlay.innerHTML = `
                    <div class="list-space-close">✕</div>
                    <div class="mobile-shorts-header">
                        <button class="mobile-select-btn">SELECT ${prettyCatName}</button>
                    </div>
                    <div class="mobile-shorts-container">
                        ${slidesHTML}
                    </div>
                    <div class="mobile-menu-backdrop"></div>
                    <div class="mobile-select-menu">
                        <div class="mobile-menu-header">
                            <h3 class="mobile-menu-title">Select ${prettyCatName}</h3>
                            <span class="mobile-menu-close">✕</span>
                        </div>
                        <div class="mobile-menu-list">
                            ${menuItemsHTML}
                        </div>
                    </div>
                `;

                document.body.appendChild(overlay);

                // Add close overlay listener
                const closeBtn = overlay.querySelector('.list-space-close');
                closeBtn.addEventListener('click', () => {
                    playSfx('menu');
                    overlay.classList.remove('active');
                    isRenderPaused = false;
                    const homeBtn = document.querySelector(".home-btn");
                    if (homeBtn && opened) homeBtn.style.display = "none";
                });

                // Set up mobile double-tap and slides logic
                const slides = overlay.querySelectorAll('.mobile-shorts-slide');
                const container = overlay.querySelector('.mobile-shorts-container');
                const selectBtn = overlay.querySelector('.mobile-select-btn');
                const selectMenu = overlay.querySelector('.mobile-select-menu');
                const menuClose = overlay.querySelector('.mobile-menu-close');
                const menuBackdrop = overlay.querySelector('.mobile-menu-backdrop');
                const menuCards = overlay.querySelectorAll('.mobile-menu-item-card');

                // Close menu function
                function closeMenu() {
                    selectMenu.classList.remove('active');
                    menuBackdrop.classList.remove('active');
                }

                selectBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playSfx('hover');
                    selectMenu.classList.add('active');
                    menuBackdrop.classList.add('active');
                });

                menuClose.addEventListener('click', closeMenu);
                menuBackdrop.addEventListener('click', closeMenu);

                menuCards.forEach(card => {
                    card.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playSfx('go');
                        const idx = parseInt(card.getAttribute('data-index'), 10);
                        menuCards.forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        closeMenu();

                        // Scroll to corresponding slide in Copy 1
                        const targetSlide = slides[N + idx];
                        if (targetSlide) {
                            targetSlide.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    });
                });

                // Track scroll to update active card in SELECT menu and handle infinite loop boundary wraps
                let lastScrollTime = 0;
                let isResettingScroll = false;

                container.addEventListener('scroll', () => {
                    const H = container.clientHeight;
                    if (!H) return;

                    const scrollTop = container.scrollTop;

                    // Infinite scroll reset boundaries
                    if (!isResettingScroll) {
                        if (scrollTop >= (2 * N - 0.5) * H) {
                            isResettingScroll = true;
                            container.scrollTop = scrollTop - N * H;
                            setTimeout(() => { isResettingScroll = false; }, 50);
                            return;
                        } else if (scrollTop <= (N - 0.5) * H) {
                            isResettingScroll = true;
                            container.scrollTop = scrollTop + N * H;
                            setTimeout(() => { isResettingScroll = false; }, 50);
                            return;
                        }
                    }

                    // Update active menu tab
                    const now = Date.now();
                    if (now - lastScrollTime < 100) return;
                    lastScrollTime = now;

                    const activeIdx = Math.round(scrollTop / H) % N;
                    if (activeIdx >= 0 && activeIdx < N) {
                        menuCards.forEach((c, idx) => {
                            if (idx === activeIdx) {
                                c.classList.add('active');
                            } else {
                                c.classList.remove('active');
                            }
                        });
                    }
                });

                // Set up slide slideshow and double-tap for each slide
                slides.forEach((slide, sIdx) => {
                    const imgWrapper = slide.querySelector('.shorts-image-wrapper');
                    const imgContainer = slide.querySelector('.shorts-slides-container');
                    const images = imgContainer.querySelectorAll('img');
                    const arrowLeft = slide.querySelector('.arrow-left');
                    const arrowRight = slide.querySelector('.arrow-right');
                    const likeIcon = slide.querySelector('.shorts-like-heart-icon');
                    const igHeart = slide.querySelector('.instagram-heart');

                    // Multiple images handling
                    let currentSlideIdx = 0;
                    function showSlide(index) {
                        if (images.length <= 1) return;
                        let targetIndex = index;
                        if (targetIndex >= images.length) targetIndex = 0;
                        if (targetIndex < 0) targetIndex = images.length - 1;

                        images[currentSlideIdx].classList.remove('active');
                        images[targetIndex].classList.add('active');
                        currentSlideIdx = targetIndex;
                    }

                    if (images.length > 1) {
                        arrowLeft.style.display = 'flex';
                        arrowRight.style.display = 'flex';

                        arrowLeft.addEventListener('click', (e) => {
                            e.stopPropagation();
                            playSfx('hover');
                            showSlide(currentSlideIdx - 1);
                        });
                        arrowRight.addEventListener('click', (e) => {
                            e.stopPropagation();
                            playSfx('hover');
                            showSlide(currentSlideIdx + 1);
                        });
                    } else {
                        arrowLeft.style.display = 'none';
                        arrowRight.style.display = 'none';
                    }

                    // Like icon toggle
                    likeIcon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playSfx('hover');
                        likeIcon.classList.toggle('liked');
                        if (likeIcon.classList.contains('liked')) {
                            likeIcon.innerHTML = '❤️';
                        } else {
                            likeIcon.innerHTML = '🤍';
                        }
                    });

                    // Double tap heart pop-up logic
                    let lastTap = 0;
                    imgWrapper.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const now = Date.now();
                        if (now - lastTap < 300) {
                            // Trigger double tap
                            playSfx('go');
                            likeIcon.classList.add('liked');
                            likeIcon.innerHTML = '❤️';

                            // Big popping heart animation using GSAP
                            gsap.killTweensOf(igHeart);
                            gsap.fromTo(igHeart,
                                { scale: 0, opacity: 0, rotation: -15 },
                                {
                                    scale: 1.4,
                                    opacity: 1,
                                    rotation: 10,
                                    duration: 0.4,
                                    ease: "back.out(2.5)",
                                    onComplete: () => {
                                        gsap.to(igHeart, {
                                            scale: 1.6,
                                            opacity: 0,
                                            y: -50,
                                            duration: 0.5,
                                            delay: 0.15,
                                            ease: "power2.in"
                                        });
                                    }
                                }
                            );
                        }
                        lastTap = now;
                    });
                });

                // Set initial scroll position to start of Copy 1 (index N) on mount
                setTimeout(() => {
                    const H = container.clientHeight || window.innerHeight;
                    container.scrollTop = N * H;
                }, 50);
            } else {
                // PC Layout
                overlay.innerHTML = `
                    <div class="list-space-close">✕</div>
                    <div class="list-space-container">
                        <div class="list-space-left-pane">
                            <div class="preview-img-wrapper">
                                <div class="preview-slides-container" style="width: 100%; height: 100%; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000;">
                                    <!-- Slides will be inserted dynamically -->
                                </div>
                                <button class="slider-arrow arrow-left">‹</button>
                                <button class="slider-arrow arrow-right">›</button>
                            </div>
                            <div class="preview-info">
                                <span class="preview-issuer"></span>
                                <h2 class="preview-title"></h2>
                                <span class="preview-highlight-badge" style="display: none; align-self: flex-start; padding: 4px 10px; border-radius: 6px; font-family: var(--font-heading); font-size: 0.7rem; font-weight: 900; background: rgba(255, 42, 133, 0.15); border: 1.5px solid #ff2a85; color: #ff2a85; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; box-shadow: 0 0 10px rgba(255, 42, 133, 0.2);"></span>
                                <p class="preview-id"></p>
                                <p class="preview-desc"></p>
                            </div>
                        </div>
                        <div class="list-space-right-pane">
                            <h3 class="grid-header-title">Select Achievement</h3>
                            <div class="achievements-grid"></div>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);

                const closeBtn = overlay.querySelector('.list-space-close');
                closeBtn.addEventListener('click', () => {
                    playSfx('menu');
                    overlay.classList.remove('active');
                    isRenderPaused = false;
                    if (window.achievementSlideshowInterval) {
                        clearInterval(window.achievementSlideshowInterval);
                        window.achievementSlideshowInterval = null;
                    }
                    const homeBtn = document.querySelector(".home-btn");
                    if (homeBtn && opened) homeBtn.style.display = "none";
                });

                const homeBtn = document.querySelector(".home-btn");
                if (homeBtn) homeBtn.style.display = "none";

                const grid = overlay.querySelector('.achievements-grid');
                grid.innerHTML = '';

                const previewImgContainer = overlay.querySelector('.preview-slides-container') || overlay.querySelector('.preview-img-wrapper');
                const previewIssuer = overlay.querySelector('.preview-issuer');
                const previewTitle = overlay.querySelector('.preview-title');
                const previewHighlightBadge = overlay.querySelector('.preview-highlight-badge');
                const previewId = overlay.querySelector('.preview-id');
                const previewDesc = overlay.querySelector('.preview-desc');

                function selectItem(item, gridCard) {
                    grid.querySelectorAll('.grid-item-card').forEach(c => c.classList.remove('active'));
                    if (gridCard) gridCard.classList.add('active');

                    // Clear any running slideshow intervals
                    if (window.achievementSlideshowInterval) {
                        clearInterval(window.achievementSlideshowInterval);
                        window.achievementSlideshowInterval = null;
                    }

                    // Resolve image array
                    let images = [];
                    if (Array.isArray(item.images)) {
                        images = item.images;
                    } else if (item.image) {
                        images = [item.image];
                    } else {
                        images = ["assets/images/cert-placeholder.png"];
                    }

                    if (previewImgContainer) {
                        previewImgContainer.innerHTML = '';
                        images.forEach((imgUrl, idx) => {
                            const img = document.createElement('img');
                            img.className = 'preview-img';
                            img.src = imgUrl;
                            img.alt = item.name;
                            img.style.cssText = `
                                position: absolute;
                                inset: 0;
                                width: 100%;
                                height: 100%;
                                object-fit: contain;
                                background: #000;
                                opacity: ${idx === 0 ? 1 : 0};
                                transition: opacity 0.4s ease-in-out;
                            `;
                            previewImgContainer.appendChild(img);
                        });
                    }

                    const arrowLeft = overlay.querySelector('.arrow-left');
                    const arrowRight = overlay.querySelector('.arrow-right');

                    let currentSlideIdx = 0;

                    function showSlide(index) {
                        const slides = previewImgContainer.querySelectorAll('.preview-img');
                        if (slides.length <= 1) return;

                        let targetIndex = index;
                        if (targetIndex >= slides.length) targetIndex = 0;
                        if (targetIndex < 0) targetIndex = slides.length - 1;

                        slides[currentSlideIdx].style.opacity = '0';
                        slides[targetIndex].style.opacity = '1';
                        currentSlideIdx = targetIndex;
                    }

                    if (images.length > 1) {
                        if (arrowLeft) arrowLeft.style.display = 'flex';
                        if (arrowRight) arrowRight.style.display = 'flex';

                        // Start auto cycle
                        window.achievementSlideshowInterval = setInterval(() => {
                            showSlide(currentSlideIdx + 1);
                        }, 3000);
                    } else {
                        if (arrowLeft) arrowLeft.style.display = 'none';
                        if (arrowRight) arrowRight.style.display = 'none';
                    }

                    // Reset arrow event listeners to prevent duplicate clicks
                    if (arrowLeft && arrowRight) {
                        const newArrowLeft = arrowLeft.cloneNode(true);
                        const newArrowRight = arrowRight.cloneNode(true);
                        arrowLeft.parentNode.replaceChild(newArrowLeft, arrowLeft);
                        arrowRight.parentNode.replaceChild(newArrowRight, arrowRight);

                        newArrowLeft.onclick = (e) => {
                            e.stopPropagation();
                            playSfx('hover');
                            if (window.achievementSlideshowInterval) {
                                clearInterval(window.achievementSlideshowInterval);
                                window.achievementSlideshowInterval = setInterval(() => {
                                    showSlide(currentSlideIdx + 1);
                                }, 3000);
                            }
                            showSlide(currentSlideIdx - 1);
                        };

                        newArrowRight.onclick = (e) => {
                            e.stopPropagation();
                            playSfx('hover');
                            if (window.achievementSlideshowInterval) {
                                clearInterval(window.achievementSlideshowInterval);
                                window.achievementSlideshowInterval = setInterval(() => {
                                    showSlide(currentSlideIdx + 1);
                                }, 3000);
                            }
                            showSlide(currentSlideIdx + 1);
                        };
                    }

                    const animTargets = [previewImgContainer, previewIssuer, previewTitle, previewId, previewDesc];
                    if (item.highlight && previewHighlightBadge) {
                        animTargets.push(previewHighlightBadge);
                    }

                    gsap.fromTo(animTargets,
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
                    );

                    previewIssuer.textContent = item.issuer;
                    previewTitle.textContent = item.name;
                    
                    if (item.highlight) {
                        if (previewHighlightBadge) {
                            previewHighlightBadge.textContent = item.highlight;
                            previewHighlightBadge.style.display = 'inline-block';
                        }
                    } else {
                        if (previewHighlightBadge) {
                            previewHighlightBadge.style.display = 'none';
                        }
                    }

                    previewId.textContent = `Credential ID / Date: ${item.id}`;
                    previewDesc.textContent = item.desc;
                }

                items.forEach((item, index) => {
                    const gridCard = document.createElement('div');
                    gridCard.className = `grid-item-card ${item.rarity}`;
                    
                    let glowColor = "rgba(255,255,255,0.4)";
                    let borderCol = "rgba(255,255,255,0.2)";
                    if (item.rarity === 'rare') { glowColor = "rgba(30,144,255,0.6)"; borderCol = "#1e90ff"; }
                    else if (item.rarity === 'epic') { glowColor = "rgba(138,43,226,0.6)"; borderCol = "#8a2be2"; }
                    else if (item.rarity === 'legendary') { glowColor = "rgba(255,215,0,0.6)"; borderCol = "#ffd700"; }
                    
                    gridCard.style.setProperty('--glow-color', glowColor);
                    gridCard.style.setProperty('--border-color', borderCol);

                    const thumbImg = Array.isArray(item.images) ? item.images[0] : (item.image || "assets/images/cert-placeholder.png");
                    const highlightHTML = item.highlight ? `<span class="grid-card-highlight">${item.highlight}</span>` : '';
                    gridCard.innerHTML = `
                        <div class="grid-card-thumbnail">
                            <img src="${thumbImg}" alt="${item.name}">
                        </div>
                        <div class="grid-card-meta">
                            <span class="grid-card-issuer">${item.issuer}</span>
                            <h4 class="grid-card-title">${item.name}</h4>
                            ${highlightHTML}
                        </div>
                    `;

                    gridCard.addEventListener('click', (e) => {
                        e.stopPropagation();
                        playSfx('hover');
                        selectItem(item, gridCard);
                    });

                    grid.appendChild(gridCard);

                    if (index === 0) {
                        selectItem(item, gridCard);
                    }
                });
            }

            setTimeout(() => {
                overlay.classList.add('active');
            }, 50);
        }

        let revealTimelines = [];

        function revealCards() {
            const closeBtn = document.getElementById("closeButton");
            if (closeBtn) closeBtn.style.display = "flex";

            const homeBtn = document.querySelector(".home-btn");
            if (homeBtn) homeBtn.style.display = "none";

            const cardContainer = document.getElementById("cardContainer");
            if (cardContainer) {
                cardContainer.style.pointerEvents = "auto";
            }

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

            let positions;
            const isMobile = window.innerWidth <= 900;
            if (isMobile) {
                positions = [
                    { left: "20%", top: "52%" },
                    { left: "50%", top: "52%" },
                    { left: "80%", top: "52%" }
                ];
            } else {
                positions = [
                    { left: "24%", top: "52%" },
                    { left: "50%", top: "52%" },
                    { left: "76%", top: "52%" }
                ];
            }

            cards.forEach((card, index) => {
                const pos = positions[index];
                const flipper = card.querySelector('.card-flipper');
                const tl = gsap.timeline({ delay: index * 0.22 });
                revealTimelines.push(tl);

                // Apply a dynamic entry flight path with rotational sways
                const startRot = (index === 0) ? -25 : (index === 2 ? 25 : -10);
                const overshootRot = (index === 0) ? 8 : (index === 2 ? -8 : 4);
                
                tl.fromTo(card,
                    { left: "50%", top: "58%", opacity: 0, scale: 0.05, rotation: startRot },
                    { opacity: 1, scale: 1.14, rotation: overshootRot, duration: 0.5, ease: "power2.out" }
                )
                .to(card, {
                    left: pos.left,
                    top: pos.top,
                    scale: 1,
                    rotation: 0,
                    duration: 0.95,
                    ease: "back.out(1.2)"
                })
                .to(flipper, {
                    rotateY: 0,
                    duration: 0.75,
                    ease: "power2.out"
                }, "-=0.6");
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
        let startX = null, startY = null;
        let clickStartTime = 0;

        function handleStart(clientX, clientY) {
            startX = clientX;
            startY = clientY;
            isDragging = false;
            clickStartTime = Date.now();
            console.log("handleStart registered startX:", startX, "startY:", startY);
        }

        function handleMove(clientX, clientY) {
            if (startX === null || startY === null) return;
            const diffX = Math.abs(clientX - startX);
            const diffY = Math.abs(clientY - startY);
            if (diffX > 30 || diffY > 30) {
                isDragging = true;
            }
        }

        function handleEnd(clientX, clientY, event) {
            startX = null;
            startY = null;

            if (opened) return;

            const clickDuration = Date.now() - clickStartTime;
            console.log("handleEnd called: clickDuration =", clickDuration, "isDragging =", isDragging);

            if (clickDuration > 300 && isDragging) {
                isDragging = false;
                console.log("handleEnd ignored chest activation due to drag event (duration:", clickDuration, "ms)");
                return;
            }

            isDragging = false;

            if (event && event.target && (event.target.closest('.hud-btn') || event.target.closest('#closeButton') || event.target.closest('.list-space-close') || event.target.closest('.category-list-space'))) {
                console.log("handleEnd ignored click on HUD / Close button / List overlay");
                return;
            }

            // Raycast check to see if the user clicked on the chest/scene objects
            let intersectsChest = false;
            try {
                const raycaster = new THREE.Raycaster();
                const mouse = new THREE.Vector2();
                mouse.x = (clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(clientY / window.innerHeight) * 2 + 1;
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);
                if (intersects.length > 0) {
                    intersectsChest = true;
                    console.log("handleEnd: Raycast intersected object:", intersects[0].object.name);
                }
            } catch (err) {
                console.error("Raycasting error in handleEnd:", err);
            }

            const isTouch = event && (event.pointerType === 'touch' || event.type.startsWith('touch') || (event.touches && event.touches.length > 0));
            const isMobile = window.innerWidth <= 900;
            const isDesktopChestArea = !isMobile && !isTouch &&
                clientX > window.innerWidth * 0.24 &&
                clientX < window.innerWidth * 0.76 &&
                clientY > window.innerHeight * 0.28 &&
                clientY < window.innerHeight * 0.82;

            console.log("handleEnd: intersectsChest =", intersectsChest, "isDesktopChestArea =", isDesktopChestArea, "isMobile =", isMobile, "isTouch =", isTouch);

            if (intersectsChest || isDesktopChestArea || isMobile || isTouch) {
                console.log("handleEnd chest activation triggered!");
                openChest();
            } else {
                console.log("handleEnd ignored click outside chest area");
            }
        }

        function onPointerDown(e) {
            handleStart(e.clientX, e.clientY);
        }

        function onPointerUp(e) {
            handleEnd(e.clientX, e.clientY, e);
        }

        function onPointerMoveDrag(e) {
            handleMove(e.clientX, e.clientY);
        }

        function openChest() {
            try {
                if (opened) return;
                opened = true;

                try {
                    playSfx('chest_open');
                } catch (soundErr) {
                    console.error("Chest sound play error:", soundErr);
                }

                const hint = document.getElementById("hint");
                if (hint) hint.style.display = "none";

                const homeBtn = document.querySelector(".home-btn");
                if (homeBtn) homeBtn.style.display = "none";

                try {
                    if (closeAnim) closeAnim.stop();
                    if (openAnim) {
                        openAnim.reset();
                        openAnim.play();
                    }
                } catch (animErr) {
                    console.error("Chest animation play error:", animErr);
                }

                setTimeout(() => {
                    try {
                        if (latch) latch.visible = false;
                    } catch (err) {}
                }, 300);

                setTimeout(() => {
                    try {
                        revealCards();
                    } catch (revealErr) {
                        console.error("Reveal cards error:", revealErr);
                    }
                }, 900);
            } catch (globalErr) {
                console.error("Global openChest error:", globalErr);
            }
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
                    playSfx('chest_close');
                    if (latch) latch.visible = true;

                    if (openAnim) openAnim.stop();
                    if (closeAnim) {
                        closeAnim.reset();
                        closeAnim.play();
                    }
                    opened = false;

                    const cardContainer = document.getElementById("cardContainer");
                    if (cardContainer) {
                        cardContainer.style.pointerEvents = "none";
                        cardContainer.scrollTop = 0;
                    }

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

            const delta = clock.getDelta();

            if (isRenderPaused) return;

            if (mixer) {
                mixer.update(delta);
            }

            if (latch && opened) {
                latch.visible = false;
            }

            controls.update();
            renderer.render(scene, camera);
        }
        animate();

        let lastWidth = window.innerWidth;
        function onResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);

            const wasMobile = lastWidth <= 900;
            const isMobile = window.innerWidth <= 900;
            lastWidth = window.innerWidth;

            if (wasMobile !== isMobile) {
                const overlay = document.querySelector('.category-list-space');
                if (overlay) {
                    const catId = overlay.dataset.catId;
                    if (catId) {
                        openCategoryListSpace(catId);
                    } else {
                        overlay.remove();
                        isRenderPaused = false;
                    }
                }
            }
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

        window.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('pointerup', onPointerUp, true);
        window.addEventListener('pointermove', onPointerMoveDrag, true);
        window.addEventListener('pointermove', onMouseMove);
        window.addEventListener('resize', onResize);

        cleanupCertificates3D = () => {
            cancelAnimationFrame(animationFrameId);
            document.body.style.cursor = 'default';
            window.removeEventListener('pointerdown', onPointerDown, true);
            window.removeEventListener('pointerup', onPointerUp, true);
            window.removeEventListener('pointermove', onPointerMoveDrag, true);
            window.removeEventListener('pointermove', onMouseMove);
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

            if (window.achievementSlideshowInterval) {
                clearInterval(window.achievementSlideshowInterval);
                window.achievementSlideshowInterval = null;
            }
            const spaceOverlay = document.querySelector('.category-list-space');
            if (spaceOverlay) spaceOverlay.remove();
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
