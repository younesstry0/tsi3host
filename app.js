const translations = {
    fr: {
        siteName: 'TSI3WEB',
        navHome: 'Accueil',
        navExercises: 'Exercices',
        navCourses: 'Cours',
        navResources: 'Ressources',
        navAbout: 'À propos',
        searchPlaceholder: 'Rechercher...',
        welcomeTitle: 'Bienvenue sur TSI3WEB',
        welcomeSubtitle: 'Votre plateforme éducative pour les ressources',
        all: 'Tous',
        priority: 'Priorité',
        download: 'Télécharger PDF',
        loading: 'Chargement...',
        errorLoad: 'Erreur lors du chargement des données',
        retry: 'Réessayer',
        math: 'Mathématiques',
        physics: 'Physique'
    },
    en: {
        siteName: 'TSI3WEB',
        navHome: 'Home',
        navExercises: 'Exercises',
        navCourses: 'Courses',
        navResources: 'General Resources',
        navAbout: 'About',
        searchPlaceholder: 'Search...',
        welcomeTitle: 'Welcome to TSI3WEB',
        welcomeSubtitle: 'Your educational platform for resources',
        all: 'All',
        priority: 'Priority',
        download: 'Download PDF',
        loading: 'Loading...',
        errorLoad: 'Error loading data',
        retry: 'Retry',
        math: 'Math',
        physics: 'Physics'
    },
    ar: {
        siteName: 'TSI3WEB',
        navHome: 'الرئيسية',
        navExercises: 'تمارين',
        navCourses: 'دروس',
        navResources: 'موارد عامة',
        navAbout: 'عن المنصة',
        searchPlaceholder: 'بحث...',
        welcomeTitle: 'مرحباً بكم في TSI3WEB',
        welcomeSubtitle: 'منصتكم التعليمية للموارد',
        all: 'الكل',
        priority: 'الأولوية',
        download: 'تحميل PDF',
        loading: 'جاري التحميل...',
        errorLoad: 'خطأ في تحميل البيانات',
        retry: 'إعادة المحاولة',
        math: 'الرياضيات',
        physics: 'الفيزياء'
    }
};

const RAW_DATA_URL = 'https://raw.githubusercontent.com/younesstry0/tsi3-web/main/tsi3web.txt';
const PARAGRAPH_URL = 'https://raw.githubusercontent.com/younesstry0/tsi3-web/main/tsi3web_para';

const CATEGORIES = {
    exercises: ['exercice', 'exercise', 'ex', 'lecon'],
    courses: ['lesson', 'course', 'lec', 'lecon'],
    resources: ['grc', 'resource', 'gen', 'pdf']
};

const state = {
    lang: 'fr',
    resources: [],
    subjects: new Set(),
    searchQuery: ''
};

const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    loadDarkMode();
    setupEventListeners();
    setupScrollAnimations();
    await loadData();
    applyTranslations();
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.about-card, .resource-card, .section-header').forEach(el => {
        observer.observe(el);
    });

    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        const backToTop = document.querySelector('.back-to-top');
        if (window.scrollY > 300) {
            backToTop?.classList.add('visible');
        } else {
            backToTop?.classList.remove('visible');
        }
    });

    const existingBackToTop = document.querySelector('.back-to-top');
    if (!existingBackToTop) {
        const backToTop = document.createElement('button');
        backToTop.className = 'back-to-top';
        backToTop.innerHTML = '↑';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.body.appendChild(backToTop);
    }
}

function setupEventListeners() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection(link.getAttribute('href').replace('#', ''));
        });
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.dataset.lang));
    });

    document.querySelector('.dark-mode-toggle').addEventListener('click', toggleDarkMode);
    document.querySelector('.menu-toggle').addEventListener('click', toggleMobileMenu);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFilterClick(btn));
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedSearch = debounce((e) => {
            state.searchQuery = e.target.value.toLowerCase();
            renderAllSections();
            showSearchSuggestions(state.searchQuery);
        }, 200);
        searchInput.addEventListener('input', debouncedSearch);
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 2) {
                showSearchSuggestions(searchInput.value.toLowerCase());
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                hideSearchSuggestions();
            }
        });
        
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideSearchSuggestions();
                searchInput.blur();
            }
        });
    }

    document.querySelector('.close-toast')?.addEventListener('click', hideError);
    
    document.querySelectorAll('.lazy-video').forEach(iframe => {
        const src = iframe.dataset.src;
        if (src) {
            iframe.src = src;
        }
    });
}

function navigateToSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${sectionId}`);
    });

    document.querySelector('.nav-links')?.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeLanguage(lang) {
    state.lang = lang;
    const isRTL = lang === 'ar';

    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    applyTranslations();
}

function applyTranslations() {
    const t = translations[state.lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (t[key]) el.placeholder = t[key];
    });

    updateDynamicButtons();
}

function updateDynamicButtons() {
    const t = translations[state.lang];

    document.querySelectorAll('.subject-filters').forEach(container => {
        const section = container.closest('.page-section').id;
        const buttons = container.querySelectorAll('.filter-btn');

        buttons.forEach(btn => {
            const subject = btn.dataset.subject;
            if (subject === 'math') btn.textContent = t.math;
            if (subject === 'physics') btn.textContent = t.physics;
            if (subject === 'all') btn.textContent = t.all;
        });

        state.subjects.forEach(subject => {
            const exists = Array.from(buttons).some(b => b.dataset.subject === subject);
            if (!exists) {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.dataset.subject = subject;
                btn.textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
                btn.addEventListener('click', () => handleFilterClick(btn, section));
                container.appendChild(btn);
            }
        });
    });
}

function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    let overlay = document.querySelector('.theme-transition');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'theme-transition';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'theme-transition__canvas';
        overlay.appendChild(canvas);
        
        document.body.appendChild(overlay);
    }
    
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const particles = [];
    const particleCount = 150;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const speed = Math.random() * 8 + 3;
        const dist = Math.random() * 50;
        
        if (isDark) {
            particles.push({
                x: centerX + Math.cos(angle) * dist,
                y: centerY + Math.sin(angle) * dist,
                startX: centerX + Math.cos(angle) * dist,
                startY: centerY + Math.sin(angle) * dist,
                endX: centerX + Math.cos(angle) * (dist + speed * 30),
                endY: centerY + Math.sin(angle) * (dist + speed * 30),
                progress: 0,
                color: `hsla(220, 90%, ${70 + Math.random() * 20}%, ${0.8 + Math.random() * 0.2})`,
                size: Math.random() * 4 + 2
            });
        } else {
            particles.push({
                x: centerX + Math.cos(angle) * (dist + speed * 30),
                y: centerY + Math.sin(angle) * (dist + speed * 30),
                startX: centerX + Math.cos(angle) * (dist + speed * 30),
                startY: centerY + Math.sin(angle) * (dist + speed * 30),
                endX: centerX + Math.cos(angle) * dist,
                endY: centerY + Math.sin(angle) * dist,
                progress: 0,
                color: `hsla(${210 + Math.random() * 30}, 70%, ${40 + Math.random() * 20}%, ${0.7 + Math.random() * 0.3})`,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    let startTime = null;
    const duration = 800;
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = 1 - Math.pow(1 - progress, 3);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, i) => {
            p.progress = eased;
            
            const x = p.startX + (p.endX - p.startX) * eased;
            const y = p.startY + (p.endY - p.startY) * eased;
            
            ctx.beginPath();
            ctx.arc(x, y, p.size * (1 - eased * 0.3), 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            if (Math.random() < 0.1 && progress < 0.8) {
                ctx.beginPath();
                ctx.arc(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, p.size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.5;
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            overlay.classList.remove('active');
        }
    }
    
    overlay.classList.add('active');
    requestAnimationFrame(animate);
    
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('darkMode', newTheme);
    }, 500);
}

function loadDarkMode() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

function toggleMobileMenu() {
    document.querySelector('.nav-links')?.classList.toggle('active');
}

async function loadData() {
    showLoading(true);
    
    const timeoutMs = 8000;
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    
    try {
        const [resourcesRes, paragraphRes] = await Promise.race([
            Promise.all([fetch(RAW_DATA_URL), fetch(PARAGRAPH_URL)]),
            timeoutPromise
        ]);

        if (!resourcesRes.ok) throw new Error('Failed to fetch');

        const text = await resourcesRes.text();
        parseResources(text);

        const homeContent = document.getElementById('homeContent');
        if (paragraphRes.ok) {
            const paraText = await paragraphRes.text();
            homeContent.innerHTML = `<p>${paraText}</p>`;
        }
    } catch (error) {
        console.warn('Fetch failed, using demo data:', error);
        const demoPara = 'TSI3WEB is a free educational platform offering math and physics courses, exercises, and downloadable resources.';
        const demoResources = `"Exercice 1" exercice math https://www.orimi.com/pdf-test.pdf\n"Exercice 2" exercice physics https://www.orimi.com/pdf-test.pdf\n"Cours 1" lesson math https://www.orimi.com/pdf-test.pdf\n"Cours 2" lesson physics https://www.orimi.com/pdf-test.pdf\n"Ressource 1" resource math https://www.orimi.com/pdf-test.pdf`;
        
        document.getElementById('homeContent').innerHTML = `<p>${demoPara}</p>`;
        parseResources(demoResources);
    } finally {
        showLoading(false);
        
        document.querySelectorAll('.resources-grid .loading, #homeContent .loading').forEach(el => {
            el.style.display = 'none';
        });
    }
}

function parseResources(text) {
    const lines = text.trim().split('\n');
    state.resources = [];
    state.subjects = new Set();

    lines.forEach(line => {
        const match = line.trim().match(/^"(.+)"\s+(\S+)\s+(\S+)\s+(.+)$/);
        if (match) {
            const [, name, category, subject, pdfLink] = match;
            state.subjects.add(subject.toLowerCase());

            state.resources.push({
                name,
                category: category.toLowerCase(),
                subject: subject.toLowerCase(),
                pdfLink,
                priority: Math.floor(Math.random() * 5) + 1
            });
        }
    });

    state.subjects.delete('math');
    state.subjects.delete('physics');

    renderAllSections();
    updateDynamicButtons();
}

function renderAllSections() {
    renderSection('exercises', state.resources.filter(r => CATEGORIES.exercises.includes(r.category)));
    renderSection('courses', state.resources.filter(r => CATEGORIES.courses.includes(r.category)));
    renderSection('resources', state.resources.filter(r => CATEGORIES.resources.includes(r.category)));
}

function renderSection(sectionId, resources) {
    const container = document.getElementById(`${sectionId}Grid`);
    const section = document.getElementById(sectionId);
    const activeFilter = section?.querySelector('.filter-btn.active')?.dataset.subject || 'all';
    const t = translations[state.lang];

    let filtered = activeFilter !== 'all'
        ? resources.filter(r => r.subject === activeFilter)
        : resources;

    if (state.searchQuery) {
        filtered = filtered.filter(r =>
            r.name.toLowerCase().includes(state.searchQuery) ||
            r.subject.toLowerCase().includes(state.searchQuery)
        );
    }

    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-spinner">
                    <div class="empty-ring"></div>
                    <div class="empty-ring"></div>
                    <div class="empty-ring"></div>
                </div>
                <p>${t.loading}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map((r, index) => {
        const icons = {
            math: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8M8 11h8M8 15h4"/></svg>',
            physics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>'
        };
        const colors = {
            math: '#8b5cf6',
            physics: '#06b6d4'
        };
        return `
        <article class="resource-card resource-card--enhanced" data-subject="${r.subject}" style="animation-delay: ${index * 0.05}s">
            <div class="card-glow" style="background: ${colors[r.subject] || colors.math}"></div>
            <div class="card-icon" style="color: ${colors[r.subject] || colors.math}">
                ${icons[r.subject] || icons.math}
            </div>
            <div class="card-header">
                <span class="resource-badge">${r.category}</span>
                <span class="resource-priority">${'★'.repeat(r.priority)}</span>
            </div>
            <h3>${r.name}</h3>
            <p class="resource-description">
                ${r.subject === 'math' ? 'Master mathematical concepts through this comprehensive course' : 'Explore physics principles with detailed explanations'}
            </p>
            <div class="resource-meta">
                <span class="resource-tag ${r.subject}" style="color: ${colors[r.subject] || colors.math}">${t[r.subject] || r.subject}</span>
                <span class="resource-type">PDF</span>
            </div>
            <div class="card-footer">
                <a href="${r.pdfLink}" target="_blank" rel="noopener noreferrer" class="resource-link" style="background: ${colors[r.subject] || colors.math}">
                    ${t.download}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                </a>
            </div>
        </article>
    `}).join('');

    const cards = container.querySelectorAll('.resource-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
    });
}

function handleFilterClick(btn, fallbackSection) {
    const section = btn.closest('.page-section')?.id || fallbackSection;
    const subject = btn.dataset.subject;

    const container = document.querySelector(`#${section} .subject-filters`);
    container?.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.subject === subject);
    });

    const exerciseCategories = ['exercice', 'exercise', 'ex'];
    const courseCategories = ['lesson', 'course', 'lec'];
    const resourceCategories = ['grc', 'resource', 'gen'];

    const categoryFilter = {
        exercises: exerciseCategories,
        courses: courseCategories,
        resources: resourceCategories
    }[section] || [];

    renderSection(section, state.resources.filter(r => categoryFilter.includes(r.category)));
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('active');
        } else {
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 500);
        }
    }
}

function showError(message) {
    const toast = document.getElementById('errorToast');
    if (toast) {
        toast.querySelector('.error-message').textContent = message;
        toast.classList.add('active');
        setTimeout(hideError, 5000);
    }
}

function hideError() {
    document.getElementById('errorToast')?.classList.remove('active');
}

function showSearchSuggestions(query) {
    const container = document.getElementById('searchSuggestions');
    if (!container || !query || query.length < 2) {
        hideSearchSuggestions();
        return;
    }
    
    const filtered = state.resources
        .filter(r => r.name.toLowerCase().includes(query))
        .slice(0, 6);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="search-no-results">No results found</div>';
    } else {
        container.innerHTML = filtered.map(r => `
            <div class="search-suggestion" data-name="${r.name}" data-link="${r.pdfLink}">
                <span class="search-suggestion-name">${r.name}</span>
                <span class="search-suggestion-tag ${r.subject}">${r.subject}</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => {
                window.open(el.dataset.link, '_blank');
                hideSearchSuggestions();
                searchInput.value = '';
                state.searchQuery = '';
                renderAllSections();
            });
        });
    }
    
    container.classList.add('active');
}

function hideSearchSuggestions() {
    const container = document.getElementById('searchSuggestions');
    if (container) {
        container.classList.remove('active');
    }
}
