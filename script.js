// --- STARFIELD CANVAS & COSMIC PARTICLES ANIMATION ---
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let stars = [];
const STAR_COUNT = 180;
let shootingStars = [];

// Spark particles escaping from the planet
let sparks = [];
const MAX_SPARKS = 25;

// Cosmic dust floating slowly in the background
let dustParticles = [];
const DUST_COUNT = 35;

// Cursor trail particles
let cursorTrail = [];

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let targetMouseX = mouseX;
let targetMouseY = mouseY;

let activeHoveredAsteroid = null;

// Resize canvas to fill viewport
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
    initDust();
}

// Initialize twinkling stars
function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            opacity: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            driftX: (Math.random() - 0.5) * 0.08,
            driftY: (Math.random() - 0.5) * 0.08
        });
    }
}

// Initialize cosmic background dust
function initDust() {
    dustParticles = [];
    for (let i = 0; i < DUST_COUNT; i++) {
        dustParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            opacity: Math.random() * 0.3 + 0.1
        });
    }
}

// Spawn a shooting star (Called every 15-20 seconds)
function spawnShootingStar() {
    if (shootingStars.length > 2) return;
    shootingStars.push({
        x: Math.random() * canvas.width * 0.7 + canvas.width * 0.2,
        y: Math.random() * canvas.height * 0.15,
        vx: -(Math.random() * 6 + 5), // fast leftwards
        vy: Math.random() * 6 + 5,    // fast downwards
        length: Math.random() * 80 + 40,
        opacity: 1.0,
        decay: Math.random() * 0.015 + 0.01
    });
}

// Spawn a spark near the central planet
function spawnSpark(planetX, planetY) {
    if (sparks.length >= MAX_SPARKS) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 0.6 + 0.2;
    const dist = Math.random() * 20 + 80; // spawn slightly outside planet core
    
    sparks.push({
        x: planetX + Math.cos(angle) * dist,
        y: planetY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.2,
        vy: Math.sin(angle) * speed - (Math.random() * 0.3 + 0.1), // general upward drift
        size: Math.random() * 2.5 + 1.2,
        opacity: Math.random() * 0.6 + 0.4,
        decay: Math.random() * 0.015 + 0.008
    });
}

// Animation loop for all canvas effects
function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const planetX = canvas.width / 2;
    const planetY = canvas.height / 2;
    
    // 1. Render twinkling background stars (with asteroid reaction)
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        let localTwinkleSpeed = star.twinkleSpeed;
        let brightnessBoost = 0;
        
        // React if near active hovered asteroid
        if (activeHoveredAsteroid) {
            const dx = star.x - activeHoveredAsteroid.x;
            const dy = star.y - activeHoveredAsteroid.y;
            const dist = Math.hypot(dx, dy);
            if (dist < activeHoveredAsteroid.radius) {
                localTwinkleSpeed = star.twinkleSpeed * 3; // twinkle faster
                brightnessBoost = 0.45 * (1 - dist / activeHoveredAsteroid.radius); // glow brighter closer to rock
            }
        }
        
        star.opacity += localTwinkleSpeed;
        if (star.opacity > 1 || star.opacity < 0) {
            star.twinkleSpeed = -star.twinkleSpeed;
        }
        
        star.x += star.driftX;
        star.y += star.driftY;
        
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, Math.max(0.1, star.opacity) + brightnessBoost)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 2. Render background cosmic dust
    for (let i = 0; i < dustParticles.length; i++) {
        const dust = dustParticles[i];
        dust.x += dust.vx;
        dust.y += dust.vy;
        
        if (dust.x < 0) dust.x = canvas.width;
        if (dust.x > canvas.width) dust.x = 0;
        if (dust.y < 0) dust.y = canvas.height;
        if (dust.y > canvas.height) dust.y = 0;
        
        ctx.fillStyle = `rgba(147, 51, 234, ${dust.opacity})`;
        ctx.beginPath();
        ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 3. Spawn and render sparks around the center planet
    if (Math.random() < 0.12) {
        spawnSpark(planetX, planetY);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.opacity -= sp.decay;
        
        if (sp.opacity <= 0) {
            sparks.splice(i, 1);
            continue;
        }
        
        ctx.fillStyle = `rgba(236, 72, 153, ${sp.opacity})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 4. Render shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.opacity -= ss.decay;
        
        if (ss.opacity <= 0 || ss.x < 0 || ss.y > canvas.height) {
            shootingStars.splice(i, 1);
            continue;
        }
        
        const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * (ss.length / 8), ss.y - ss.vy * (ss.length / 8));
        grad.addColorStop(0, `rgba(255, 255, 255, ${ss.opacity})`);
        grad.addColorStop(0.2, `rgba(192, 132, 252, ${ss.opacity * 0.8})`);
        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * (ss.length / 10), ss.y - ss.vy * (ss.length / 10));
        ctx.stroke();
    }
    
    // 5. Render cursor trail
    for (let i = cursorTrail.length - 1; i >= 0; i--) {
        const p = cursorTrail[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= p.decay;
        
        if (p.opacity <= 0) {
            cursorTrail.splice(i, 1);
            continue;
        }
        
        ctx.fillStyle = p.color ? p.color.replace('0.8', p.opacity * 0.8) : `rgba(168, 85, 247, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.opacity, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 6. Smooth Mouse Parallax (updates visual positions of elements)
    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;
    
    const wHalf = window.innerWidth / 2;
    const hHalf = window.innerHeight / 2;
    const deltaX = (mouseX - wHalf) / wHalf;
    const deltaY = (mouseY - hHalf) / hHalf;
    
    // Parallax central planet system & individual asteroids (disabled on mobile to avoid layout shifts)
    const planetSys = document.querySelector('.planet-system');
    const astModules = document.querySelectorAll('.asteroid-module');
    
    if (window.innerWidth > 768) {
        if (planetSys) {
            planetSys.style.transform = `translate3d(${deltaX * 18}px, ${deltaY * 18}px, 0)`;
        }
        
        astModules.forEach(ast => {
            let depth = 0.2;
            if (ast.id === 'ast-resume') depth = 0.28;
            if (ast.id === 'ast-projects') depth = 0.35;
            if (ast.id === 'ast-certificates') depth = 0.24;
            if (ast.id === 'ast-music') depth = 0.18;
            if (ast.id === 'ast-contact') depth = 0.32;
            
            const moveX = deltaX * 36 * depth;
            const moveY = deltaY * 36 * depth;
            ast.style.transform = `translate3d(${moveX}px, ${moveY}px, 0px)`;
        });
    } else {
        if (planetSys) planetSys.style.transform = '';
        astModules.forEach(ast => {
            ast.style.transform = '';
        });
    }
    
    // 7. Update orbital positions for tech stars
    updateTechStars(planetX, planetY);
    
    requestAnimationFrame(animateCanvas);
}



// Shooting Star spawner interval (15-20 seconds)
setInterval(spawnShootingStar, 17500);

// Capture mouse movements for cursor trails and parallax targets
document.addEventListener('mousemove', (e) => {
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;
    
    // Spawn cursor trail particles
    if (Math.random() < 0.45) {
        cursorTrail.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 1.4,
            vy: (Math.random() - 0.5) * 1.4,
            size: Math.random() * 4.5 + 2.0,
            opacity: 1.0,
            decay: Math.random() * 0.02 + 0.016,
            color: Math.random() < 0.55 ? 'rgba(192, 132, 252, 0.8)' : 'rgba(34, 211, 238, 0.8)'
        });
    }
});


// --- DRIFTING TECH STARS CONTROLLER (Zero Gravity) ---
const stage = document.getElementById('physics-stage');
const techBodies = [];
const techStarNames = [];
// "Python", "C++", "MATLAB", "Arduino", "AI", "Docker", "HTML/CSS", "JS"

techStarNames.forEach((name, i) => {
    const el = document.createElement('div');
    el.className = 'tech-star';
    el.textContent = name;
    stage.appendChild(el);
    
    // Choose random starting coordinates
    const w = window.innerWidth;
    const h = window.innerHeight;
    const tx = Math.random() * (w - 180) + 90;
    const ty = Math.random() * (h - 180) + 90;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.45 + Math.random() * 0.45; // slow drift speed
    
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

// Update tech stars position with bouncing bounds
function updateTechStars(planetX, planetY) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    techBodies.forEach(star => {
        if (!star.hovered) {
            star.x += star.vx;
            star.y += star.vy;
            
            const elWidth = star.element.offsetWidth || 70;
            const elHeight = star.element.offsetHeight || 30;
            
            // Boundary collisions
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
        
        star.element.style.left = `${star.x}px`;
        star.element.style.top = `${star.y}px`;
    });
}


// --- ACTIVE INTERACTION & ASTEROID TRIGGERS ---
const astModules = document.querySelectorAll('.asteroid-module');

astModules.forEach(ast => {
    // 1. Mouse enter registers star twinkle focus
    ast.addEventListener('mouseenter', () => {
        const rect = ast.getBoundingClientRect();
        activeHoveredAsteroid = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: 180
        };
    });
    
    ast.addEventListener('mouseleave', () => {
        activeHoveredAsteroid = null;
    });
    
    // 2. Click initiates smooth camera zoom and triggers modals
    ast.addEventListener('click', () => {
        document.body.classList.add('zoomed');
        const modalId = ast.id.replace('ast-', '') + '-modal';
        
        // Delay opening modal slightly to let camera transition start smoothly
        setTimeout(() => {
            openModal(modalId);
        }, 380);
    });
});


// --- TAGLINE TYPEWRITER EFFECT ---
const typewriterText = "Full Stack Developer & Cosmic Creator. Crafting high-performance digital experiences.";
let typewriterIndex = 0;
const bioEl = document.getElementById('tagline-text');

function typeWriter() {
    if (typewriterIndex < typewriterText.length && bioEl) {
        bioEl.textContent += typewriterText.charAt(typewriterIndex);
        typewriterIndex++;
        setTimeout(typeWriter, 35);
    }
}

// Start typewriter on load
document.addEventListener('DOMContentLoaded', typeWriter);


// --- MODAL CONTROLLER SYSTEM ---
const modalOverlay = document.getElementById('modal-overlay');
const closeButtons = document.querySelectorAll('.close-btn');
const modalCards = document.querySelectorAll('.modal-card');

function openModal(modalId) {
    modalOverlay.classList.add('active');
    modalCards.forEach(card => card.classList.remove('active'));
    const targetModal = document.getElementById(modalId);
    if (targetModal) {
        targetModal.classList.add('active');
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
    modalCards.forEach(card => card.classList.remove('active'));
    document.body.classList.remove('zoomed');
}

// Close button triggers
closeButtons.forEach(btn => {
    btn.addEventListener('click', closeModal);
});

// Click outside card closes modals
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});


// --- WEB AUDIO API COSMIC SYNTHESIZER ---
let audioCtx = null;
let humOsc = null;
let humGain = null;
let humFilter = null;
let chimeInterval = null;
let chimeGainNode = null;
let isPlayingSynth = false;

const playBtn = document.getElementById('synth-play-btn');
const synthPanel = document.querySelector('.synth-panel');
const synthStatus = document.getElementById('synth-status');
const synthDetails = document.getElementById('synth-details');
const freqSlider = document.getElementById('synth-freq');

// Scale for space chimes (Pentatonic E minor / G major chord notes)
const spaceChimesScale = [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25];

function initSynth() {
    // 1. Create Audio Context
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 2. Setup Low Cabin Hum
    humOsc = audioCtx.createOscillator();
    humFilter = audioCtx.createBiquadFilter();
    humGain = audioCtx.createGain();
    
    humOsc.type = 'sawtooth';
    humOsc.frequency.setValueAtTime(parseFloat(freqSlider.value) / 2, audioCtx.currentTime); // Low freq (default 55Hz)
    
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(90, audioCtx.currentTime); // Block high harmonics
    
    humGain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Soft volume
    
    humOsc.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(audioCtx.destination);
    
    // 3. Setup Feedback Delay node for celestial chimes
    const delayNode = audioCtx.createDelay(2.0);
    const feedbackGain = audioCtx.createGain();
    
    delayNode.delayTime.setValueAtTime(0.7, audioCtx.currentTime); // 700ms echo duration
    feedbackGain.gain.setValueAtTime(0.45, audioCtx.currentTime); // Echo feedback strength
    
    // Feedback loop connection
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    
    // Chime gain output node
    chimeGainNode = audioCtx.createGain();
    chimeGainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    
    // Connect chime node to both main destination and echo line
    chimeGainNode.connect(audioCtx.destination);
    chimeGainNode.connect(delayNode);
    delayNode.connect(audioCtx.destination);
    
    // Start oscillators
    humOsc.start();
    
    // Start random chime generator interval
    chimeInterval = setInterval(playRandomChime, 2500);
}

function playRandomChime() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    
    // Create random single sine oscillator for pure chime sound
    const chimeOsc = audioCtx.createOscillator();
    const envelope = audioCtx.createGain();
    
    chimeOsc.type = 'sine';
    // Select random frequency from space chord scale
    const noteFreq = spaceChimesScale[Math.floor(Math.random() * spaceChimesScale.length)];
    chimeOsc.frequency.setValueAtTime(noteFreq, audioCtx.currentTime);
    
    // Slow volume ramp in and long exponential decay out
    envelope.gain.setValueAtTime(0, audioCtx.currentTime);
    envelope.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.08);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 4.0);
    
    chimeOsc.connect(envelope);
    envelope.connect(chimeGainNode);
    
    chimeOsc.start();
    // Stop oscillator after 4.2 seconds to free browser memory
    chimeOsc.stop(audioCtx.currentTime + 4.5);
}

function toggleSynth() {
    const hudAudioBtn = document.getElementById('audio-toggle-btn');
    if (!isPlayingSynth) {
        // Start synth
        if (!audioCtx) {
            initSynth();
        } else if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        isPlayingSynth = true;
        synthPanel.classList.add('active');
        synthStatus.textContent = 'Synthesizer Active';
        synthDetails.textContent = 'Streaming Cosmic Hum & Ambient Chimes';
        playBtn.classList.add('playing');
        playBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            </svg>
        `;
        if (hudAudioBtn) {
            hudAudioBtn.classList.add('playing');
            hudAudioBtn.querySelector('span').textContent = 'Active';
        }
    } else {
        // Pause audio context to stop sound instantly
        if (audioCtx) {
            audioCtx.suspend();
        }
        
        isPlayingSynth = false;
        synthPanel.classList.remove('active');
        synthStatus.textContent = 'Synthesizer Paused';
        synthDetails.textContent = 'Generator standby';
        playBtn.classList.remove('playing');
        playBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
        `;
        if (hudAudioBtn) {
            hudAudioBtn.classList.remove('playing');
            hudAudioBtn.querySelector('span').textContent = 'Muted';
        }
    }
}

// Bind music corner synthesizer events
playBtn.addEventListener('click', toggleSynth);

// Handle Hum Frequency slider changes
freqSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (humOsc && audioCtx) {
        // Smoothly transition hum frequency to avoid click/pop sounds
        humOsc.frequency.setTargetAtTime(val / 2, audioCtx.currentTime, 0.1);
    }
});

// Bind HUD space audio ambience toggle button
const hudAudioBtn = document.getElementById('audio-toggle-btn');
if (hudAudioBtn) {
    hudAudioBtn.addEventListener('click', toggleSynth);
}

// Initial setup (run at the end of script to prevent Temporal Dead Zone ReferenceErrors)
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animateCanvas();
