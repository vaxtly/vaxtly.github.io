(() => {
    const REPO = 'vaxtly/app';
    const FALLBACK = 'https://github.com/' + REPO + '/releases/latest';
    const assets = {};

    // Fetch release assets + version
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest')
        .then(r => r.json())
        .then(release => {
            if (!release) return;

            // Update version badge
            if (release.tag_name) {
                const ver = release.tag_name.replace(/^v/, '');
                const badge = document.getElementById('hero-version');
                if (badge) badge.textContent = 'v' + ver;
                // Update structured data
                const ldJson = document.querySelector('script[type="application/ld+json"]');
                if (ldJson) {
                    try {
                        const data = JSON.parse(ldJson.textContent);
                        data.softwareVersion = ver;
                        ldJson.textContent = JSON.stringify(data);
                    } catch (e) { }
                }
            }

            if (!release.assets) return;

            release.assets.forEach(a => {
                const name = a.name.toLowerCase();
                if (name.endsWith('.exe') && name.includes('setup')) assets.exe = a.browser_download_url;
                else if (name.endsWith('.appimage')) assets.appimage = a.browser_download_url;
                else if (name.endsWith('.deb')) assets.deb = a.browser_download_url;
                else if (name.endsWith('.dmg') && name.includes('arm64')) assets.dmgArm64 = a.browser_download_url;
                else if (name.endsWith('.dmg') && name.includes('x64')) assets.dmgX64 = a.browser_download_url;
            });

            // Update download links
            if (assets.appimage) document.getElementById('dl-appimage').href = assets.appimage;
            if (assets.deb) document.getElementById('dl-deb').href = assets.deb;
            if (assets.exe) document.getElementById('win-dl-fallback').href = assets.exe;
            if (assets.dmgArm64) document.getElementById('dl-mac-dmg').href = assets.dmgArm64;
        })
        .catch(err => {
            console.warn('Failed to fetch release assets:', err);
        });

    // Fetch GitHub stars
    fetch('https://api.github.com/repos/' + REPO)
        .then(r => r.json())
        .then(data => {
            if (!data || !data.stargazers_count) return;
            const count = data.stargazers_count;
            const formatted = count >= 1000 ? (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(count);
            const el = document.getElementById('gh-stars');
            if (el) el.textContent = '\u2605 ' + formatted;
            const el2 = document.getElementById('gh-stars-closing');
            if (el2) el2.textContent = '\u2605 ' + formatted;
        })
        .catch(() => { });

    // Feature Card Spotlight Hover Effect
    const cards = document.querySelectorAll('.feature-card');
    document.addEventListener('mousemove', e => {
        for (const card of cards) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    });

    // Hero install tab switching
    const heroInstall = document.querySelector('.hero-install');
    if (heroInstall) {
        const tabs = heroInstall.querySelectorAll('.os-tab');
        const tabContents = heroInstall.querySelectorAll('.hero-tab-content');
        const indicator = heroInstall.querySelector('.os-tab-indicator');

        const detectOS = () => {
            const ua = navigator.userAgent.toLowerCase();
            if (ua.includes('mac')) return 'mac';
            if (ua.includes('win')) return 'windows';
            return 'linux';
        };

        const switchTab = (os) => {
            tabs.forEach(t => {
                const isActive = t.getAttribute('data-os') === os;
                t.classList.toggle('active', isActive);

                if (isActive && indicator) {
                    // Update the sliding indicator pill to perfectly match
                    indicator.style.width = `${t.offsetWidth}px`;
                    indicator.style.height = `${t.offsetHeight}px`;
                    indicator.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop}px)`;
                }
            });
            tabContents.forEach(c => { c.classList.toggle('active', c.getAttribute('data-os') === os); });
        };

        // Auto-select detected OS
        // Need a slight delay to ensure fonts/layout are ready for the indicator width calculations
        setTimeout(() => switchTab(detectOS()), 50);

        // Tab click handling
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.getAttribute('data-os'));
            });
        });

        // Copy buttons logic
        const copyToClipboard = (btnId, text) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            btn.addEventListener('click', function () {
                navigator.clipboard.writeText(text).then(() => {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<svg width="14" height="14" fill="none" stroke="var(--emerald)" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 2000);
                });
            });
        };

        copyToClipboard('copy-scoop', 'scoop bucket add vaxtly https://github.com/vaxtly/scoop-bucket\nscoop install vaxtly');
        copyToClipboard('copy-brew', 'brew install vaxtly/tap/vaxtly');
        copyToClipboard('copy-snap', 'snap install vaxtly');
    }

    // Dynamic footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('nav-open');
            navToggle.classList.toggle('active', isOpen);
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('nav-open');
                navToggle.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('nav-open');
                navToggle.classList.remove('active');
            }
        });
    }

    // Scroll Reveal Animation Observer
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -100px 0px', threshold: 0.1 });

        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        revealElements.forEach(el => el.classList.add('active'));
    }

})();
