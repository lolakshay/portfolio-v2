window.SpaceTransitionManager = (function () {
    let isTransitioning = false;

    // Route color mappings
    const routeColors = {
        'resume.html': 'var(--color-resume)',
        'projects.html': 'var(--color-projects)',
        'certificates.html': 'var(--color-certificates)',
        'music.html': 'var(--color-music)',
        'contact.html': 'var(--color-contact)',
        'index.html': 'var(--primary)'
    };

    // Lazy load / inject transition structure if missing
    function ensurePortalElements() {
        let portal = document.querySelector('.portal-transition');
        if (!portal) {
            portal = document.createElement('div');
            portal.className = 'portal-transition';
            portal.innerHTML = `
                <div class="portal-layer portal-layer-1"></div>
                <div class="portal-layer portal-layer-2"></div>
            `;
            document.body.appendChild(portal);
        }
        return portal;
    }

    function triggerPortal(targetUrl, swapCallback) {
        if (isTransitioning) return;
        isTransitioning = true;

        const portal = ensurePortalElements();
        const layer1 = portal.querySelector('.portal-layer-1');
        
        // Find matching route color
        const file = targetUrl.split('/').pop() || 'index.html';
        const targetColor = routeColors[file] || 'var(--primary)';
        
        // Apply color to transition splash layer
        layer1.style.background = targetColor;

        // 1. Play Screen Shake on current layout
        const mainContainer = document.querySelector('.hero-container');
        if (mainContainer) {
            mainContainer.classList.add('screen-shake');
        }

        // 2. Open Liquid Splash Portal
        portal.classList.add('active');

        // 3. Swap Content at peak coverage (approx 450ms)
        setTimeout(() => {
            if (swapCallback) swapCallback();
        }, 450);

        // 4. Close Portal & Dissolve
        setTimeout(() => {
            portal.classList.remove('active');
            if (mainContainer) {
                mainContainer.classList.remove('screen-shake');
            }
            isTransitioning = false;
        }, 900);
    }

    return {
        transitionTo: function (targetUrl, swapCallback) {
            triggerPortal(targetUrl, swapCallback);
        },
        isTransitioning: function () {
            return isTransitioning;
        }
    };
})();
