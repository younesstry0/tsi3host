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
    exercises: ['exercice', 'exercise', 'ex'],
    courses: ['lesson', 'course', 'lec'],
    resources: ['grc', 'resource', 'gen']
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
    await loadData();
    applyTranslations();
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
        }, 200);
        searchInput.addEventListener('input', debouncedSearch);
    }

    document.querySelector('.close-toast')?.addEventListener('click', hideError);
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
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('darkMode', newTheme);
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
    try {
        const [resourcesRes, paragraphRes] = await Promise.all([
            fetch(RAW_DATA_URL),
            fetch(PARAGRAPH_URL)
        ]);

        if (!resourcesRes.ok) throw new Error('Failed to fetch');

        const text = await resourcesRes.text();
        parseResources(text);

        const homeContent = document.getElementById('homeContent');
        if (paragraphRes.ok) {
            homeContent.innerHTML = `<p>${await paragraphRes.text()}</p>`;
        }
    } catch (error) {
        showError(translations[state.lang].errorLoad);
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function parseResources(text) {
    const lines = text.trim().split('\n');
    state.resources = [];
    state.subjects = new Set();

    lines.forEach(line => {
        const match = line.trim().match(/^"(.+)"\s+(\w+)\s+(\w+)\s+(.+)$/);
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
        container.innerHTML = `<div class="loading">${t.loading}</div>`;
        return;
    }

    container.innerHTML = filtered.map(r => `
        <article class="resource-card" data-subject="${r.subject}">
            <span class="resource-badge">${r.category}</span>
            <h3>${r.name}</h3>
            <div class="resource-meta">
                <span class="resource-tag ${r.subject}">${t[r.subject] || r.subject}</span>
                <span class="resource-priority">${'★'.repeat(r.priority)}</span>
            </div>
            <a href="${r.pdfLink}" target="_blank" rel="noopener noreferrer" class="resource-link">
                ${t.download}
            </a>
        </article>
    `).join('');
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
    document.getElementById('loadingOverlay')?.classList.toggle('active', show);
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
