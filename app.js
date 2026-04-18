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

let currentLang = 'fr';
let allResources = [];
let dynamicSubjects = [];
let currentFilter = { section: 'all', subject: 'all' };
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    await loadData();
    applyTranslations();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('href').replace('#', '');
            navigateToSection(section);
        });
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.dataset.lang));
    });

    document.querySelector('.dark-mode-toggle').addEventListener('click', toggleDarkMode);

    document.querySelector('.menu-toggle').addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = btn.closest('.page-section').id;
            const subject = btn.dataset.subject;
            setFilter(section, subject);
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderAllSections();
        });
    }

    document.querySelector('.close-toast').addEventListener('click', hideError);
}

function navigateToSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`.nav-links a[href="#${sectionId}"]`)?.classList.add('active');

    document.querySelector('.nav-links').classList.remove('active');
    window.scrollTo(0, 0);
}

function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const isRTL = lang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    applyTranslations();
}

function applyTranslations() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (t[key]) el.placeholder = t[key];
    });

    updateDynamicSubjectButtons();
}

function updateDynamicSubjectButtons() {
    const t = translations[currentLang];
    document.querySelectorAll('.subject-filters').forEach(container => {
        const section = container.closest('.page-section').id;
        const buttons = container.querySelectorAll('.filter-btn');
        
        buttons.forEach(btn => {
            if (btn.dataset.subject === 'math') btn.textContent = t.math;
            if (btn.dataset.subject === 'physics') btn.textContent = t.physics;
            if (btn.dataset.subject === 'all') btn.textContent = t.all;
        });

        dynamicSubjects.forEach(subject => {
            const existing = Array.from(buttons).find(b => b.dataset.subject === subject);
            if (!existing) {
                const newBtn = document.createElement('button');
                newBtn.className = 'filter-btn';
                newBtn.dataset.subject = subject;
                newBtn.textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
                newBtn.addEventListener('click', () => setFilter(section, subject));
                container.appendChild(newBtn);
            }
        });
    });
}

function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
}

function loadDarkMode() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

async function loadData() {
    showLoading(true);
    try {
        const [resourcesResponse, paragraphResponse] = await Promise.all([
            fetch(RAW_DATA_URL),
            fetch(PARAGRAPH_URL)
        ]);

        if (!resourcesResponse.ok) throw new Error('Failed to fetch resources');
        
        const resourcesText = await resourcesResponse.text();
        parseResources(resourcesText);

        const homeContent = document.getElementById('homeContent');
        if (paragraphResponse.ok) {
            const paragraphText = await paragraphResponse.text();
            homeContent.innerHTML = `<p>${paragraphText}</p>`;
        } else {
            homeContent.innerHTML = `<p>${translations[currentLang].loading}</p>`;
        }
    } catch (error) {
        showError(translations[currentLang].errorLoad);
        console.error('Error loading data:', error);
    } finally {
        showLoading(false);
    }
}

function parseResources(text) {
    const lines = text.trim().split('\n');
    allResources = [];
    const subjects = new Set();

    lines.forEach(line => {
        const match = line.trim().match(/^"(.+)"\s+(\w+)\s+(\w+)\s+(.+)$/);
        if (match) {
            const name = match[1];
            const category = match[2].toLowerCase();
            const subject = match[3].toLowerCase();
            const pdfLink = match[4];

            subjects.add(subject);

            allResources.push({
                name,
                category,
                subject,
                pdfLink,
                priority: Math.floor(Math.random() * 5) + 1
            });
        }
    });

    dynamicSubjects = Array.from(subjects).filter(s => s !== 'math' && s !== 'physics');
    renderAllSections();
    updateDynamicSubjectButtons();
}

function renderAllSections() {
    const exerciseCategories = ['exercice', 'exercise', 'ex'];
    const courseCategories = ['lesson', 'course', 'lec'];
    const resourceCategories = ['grc', 'resource', 'gen'];
    
    renderSection('exercises', allResources.filter(r => exerciseCategories.includes(r.category)));
    renderSection('courses', allResources.filter(r => courseCategories.includes(r.category)));
    renderSection('resources', allResources.filter(r => resourceCategories.includes(r.category)));
}

function renderSection(sectionId, resources) {
    const container = document.getElementById(`${sectionId}Grid`);
    const section = document.getElementById(sectionId);
    const activeFilter = section.querySelector('.filter-btn.active')?.dataset.subject || 'all';

    let filtered = resources;
    
    if (activeFilter !== 'all') {
        filtered = resources.filter(r => r.subject === activeFilter);
    }

    if (searchQuery) {
        filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(searchQuery) || 
            r.subject.toLowerCase().includes(searchQuery)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="loading">${translations[currentLang].loading}</div>`;
        return;
    }

    container.innerHTML = filtered.map(r => `
        <div class="resource-card" data-subject="${r.subject}">
            <span class="resource-badge">${r.category}</span>
            <h3>${r.name}</h3>
            <div class="resource-meta">
                <span class="resource-tag ${r.subject}">${translations[currentLang][r.subject] || r.subject}</span>
                <span class="resource-priority">${'★'.repeat(r.priority)}</span>
            </div>
            <a href="${r.pdfLink}" target="_blank" class="resource-link">
                ${translations[currentLang].download}
            </a>
        </div>
    `).join('');
}

function setFilter(section, subject) {
    const container = document.querySelector(`#${section} .subject-filters`);
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.subject === subject);
    });

    const sectionId = section === 'exercises' ? 'exercises' : 
                      section === 'courses' ? 'courses' : 'resources';
    const exerciseCategories = ['exercice', 'exercise', 'ex'];
    const courseCategories = ['lesson', 'course', 'lec'];
    const resourceCategories = ['grc', 'resource', 'gen'];
    
    renderSection(sectionId, allResources.filter(r => {
        if (sectionId === 'exercises') return exerciseCategories.includes(r.category);
        if (sectionId === 'courses') return courseCategories.includes(r.category);
        if (sectionId === 'resources') return resourceCategories.includes(r.category);
    }));
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function showError(message) {
    const toast = document.getElementById('errorToast');
    toast.querySelector('.error-message').textContent = message;
    toast.classList.add('active');
    setTimeout(hideError, 5000);
}

function hideError() {
    document.getElementById('errorToast').classList.remove('active');
}

loadDarkMode();