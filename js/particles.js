(function () {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let dust = [];
    
    // Parallax mouse targets
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    // Sizing system
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    // Debounced resize to avoid layout thrashing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 250);
    });

    // Particle Classes
    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.3 + 0.5;
            this.baseAlpha = Math.random() * 0.5 + 0.3;
            this.alpha = this.baseAlpha;
            this.twinkleSpeed = Math.random() * 0.02 + 0.005;
            this.phase = Math.random() * Math.PI * 2;
        }

        update() {
            this.phase += this.twinkleSpeed;
            this.alpha = this.baseAlpha + Math.sin(this.phase) * 0.3;
            if (this.alpha < 0) this.alpha = 0;
            if (this.alpha > 1) this.alpha = 1;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class Dust {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            // Drifts extremely slowly
            this.vx = (Math.random() - 0.5) * 0.05;
            this.vy = (Math.random() - 0.5) * 0.05;
            this.alpha = Math.random() * 0.2 + 0.08;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Wrap boundaries
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = `rgba(138, 43, 226, ${this.alpha})`; // Purple space dust
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        stars = [];
        dust = [];
        
        // Star count: 50-80 max
        const starCount = Math.floor(Math.min(75, (canvas.width * canvas.height) / 18000));
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }

        // Dust count: 10-15 max
        for (let i = 0; i < 12; i++) {
            dust.push(new Dust());
        }
    }

    // Parallax mouse movements (desktop only)
    if (window.innerWidth > 768) {
        window.addEventListener('mousemove', (e) => {
            targetX = (e.clientX - window.innerWidth / 2) * 0.025;
            targetY = (e.clientY - window.innerHeight / 2) * 0.025;
        });
    }

    function animate() {
        // Clear background transparently to let CSS radial nebula gradient show through
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Smooth mouse target interpolation for parallax
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        ctx.save();
        // Translate the context to achieve 3D space depth parallax
        ctx.translate(mouseX, mouseY);

        // Render & update particles
        for (let i = 0; i < stars.length; i++) {
            stars[i].update();
            stars[i].draw();
        }

        for (let i = 0; i < dust.length; i++) {
            dust[i].update();
            dust[i].draw();
        }

        ctx.restore();
        
        requestAnimationFrame(animate);
    }

    // Trigger Canvas Setup
    resizeCanvas();
    animate();
})();
