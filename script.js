(function () {
    'use strict';

    const CONFIG = {
        typing: {
            words: ['modernes', 'accessibles', 'responsives'],
            typeSpeed: 190,
            deleteSpeed: 70,
            pauseAfterWord: 2000,
            startDelay: 800
        },
        counter: {
            duration: 1600
        },
        reveal: {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        },
        backToTop: {
            threshold: 400
        },
        contactForm: {
            simulatedDelay: 1500,
            maxMessageLength: 500
        },
        storageKeys: {
            theme: 'rogatiana-portfolio-theme'
        },
        preloader: {
            minDuration: 1200
        }
    };

    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const safeStorage = {
        get(key, fallback = null) {
            try {
                return localStorage.getItem(key) ?? fallback;
            } catch {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch {
                return;
            }
        }
    };

    const PreloaderModule = (() => {
        const preloader = $('#preloader');
        if (!preloader) return { init: () => { } };

        const init = () => {
            const startTime = performance.now();

            const hidePreloader = () => {
                const elapsed = performance.now() - startTime;
                const remaining = Math.max(0, CONFIG.preloader.minDuration - elapsed);

                setTimeout(() => {
                    preloader.classList.add('hidden');
                    setTimeout(() => preloader.remove(), 700);
                }, remaining);
            };

            if (document.readyState === 'complete') {
                hidePreloader();
            } else {
                window.addEventListener('load', hidePreloader);
            }
        };

        return { init };
    })();

    const ThemeModule = (() => {
        const toggle = $('#themeToggle');
        if (!toggle) return { init: () => { } };

        const icon = toggle.querySelector('i');
        const STORAGE_KEY = CONFIG.storageKeys.theme;

        const applyTheme = (theme) => {
            const isDark = theme === 'dark';
            document.body.classList.toggle('dark', isDark);
            if (icon) {
                icon.classList.toggle('fa-moon', !isDark);
                icon.classList.toggle('fa-sun', isDark);
            }
        };

        const init = () => {
            const savedTheme = safeStorage.get(STORAGE_KEY, 'light');
            applyTheme(savedTheme);

            toggle.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark');
                applyTheme(isDark ? 'dark' : 'light');
                safeStorage.set(STORAGE_KEY, isDark ? 'dark' : 'light');
            });
        };

        return { init };
    })();

    const MenuModule = (() => {
        const burger = $('#burgerBtn');
        const nav = $('#navLinks');
        if (!burger || !nav) return { init: () => { } };

        const navItems = $$('.nav-link', nav);

        const close = () => {
            nav.classList.remove('active');
            burger.classList.remove('active');
            burger.setAttribute('aria-expanded', 'false');
            burger.setAttribute('aria-label', 'Ouvrir le menu');
        };

        const open = () => {
            nav.classList.add('active');
            burger.classList.add('active');
            burger.setAttribute('aria-expanded', 'true');
            burger.setAttribute('aria-label', 'Fermer le menu');
        };

        const init = () => {
            burger.addEventListener('click', (e) => {
                e.stopPropagation();
                nav.classList.contains('active') ? close() : open();
            });

            navItems.forEach((link) => link.addEventListener('click', close));

            document.addEventListener('click', (e) => {
                if (
                    nav.classList.contains('active') &&
                    !nav.contains(e.target) &&
                    !burger.contains(e.target)
                ) {
                    close();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') close();
            });
        };

        return { init };
    })();

    const ScrollModule = (() => {
        const sections = $$('section[id]');
        const navLinks = $$('.nav-link');
        const progressBar = $('#scrollProgress');
        const backToTop = $('#backToTop');

        let ticking = false;

        const updateActiveLink = () => {
            const scrollPos = window.scrollY + 120;
            let currentSection = null;

            sections.forEach((section) => {
                const top = section.offsetTop;
                const bottom = top + section.offsetHeight;
                if (scrollPos >= top && scrollPos < bottom) {
                    currentSection = section.getAttribute('id');
                }
            });

            if (currentSection) {
                navLinks.forEach((link) => {
                    const isActive = link.getAttribute('href') === `#${currentSection}`;
                    link.classList.toggle('active', isActive);
                });
            }
        };

        const updateProgress = () => {
            if (!progressBar) return;
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = `${progress}%`;
        };

        const updateBackToTop = () => {
            if (!backToTop) return;
            backToTop.classList.toggle('visible', window.scrollY > CONFIG.backToTop.threshold);
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                updateActiveLink();
                updateProgress();
                updateBackToTop();
                ticking = false;
            });
        };

        const init = () => {
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });

            if (backToTop) {
                backToTop.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                    });
                });
            }

            onScroll();
        };

        return { init };
    })();

    const RevealModule = (() => {
        const elements = $$('.reveal');

        if (!elements.length || !('IntersectionObserver' in window)) {
            elements.forEach((el) => el.classList.add('visible'));
            return { init: () => { } };
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            CONFIG.reveal
        );

        const init = () => {
            elements.forEach((el) => observer.observe(el));
        };

        return { init };
    })();

    const CounterModule = (() => {
        const counters = $$('.stat-number');
        if (!counters.length) return { init: () => { } };

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (el) => {
            const target = parseInt(el.dataset.count, 10) || 0;
            const suffix = el.dataset.suffix || '';
            const duration = CONFIG.counter.duration;

            if (prefersReducedMotion()) {
                el.textContent = target + suffix;
                return;
            }

            const startTime = performance.now();

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const value = Math.floor(easeOutCubic(progress) * target);
                el.textContent = value + suffix;

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = target + suffix;
                }
            };

            requestAnimationFrame(tick);
        };

        const init = () => {
            if (!('IntersectionObserver' in window)) {
                counters.forEach(animate);
                return;
            }

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            animate(entry.target);
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.5 }
            );

            counters.forEach((counter) => observer.observe(counter));
        };

        return { init };
    })();

    const TypingModule = (() => {
        const el = $('.hero-highlight');
        if (!el || prefersReducedMotion()) return { init: () => { } };

        const words = CONFIG.typing.words;
        const typeSpeed = CONFIG.typing.typeSpeed;
        const deleteSpeed = CONFIG.typing.deleteSpeed;
        const pauseAfterWord = CONFIG.typing.pauseAfterWord;
        const startDelay = CONFIG.typing.startDelay;

        let wordIndex = 0;
        let charIndex = 0;
        let deleting = false;
        let timerId = null;

        const tick = () => {
            const currentWord = words[wordIndex];

            if (!deleting) {
                el.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;

                if (charIndex === currentWord.length) {
                    deleting = true;
                    timerId = setTimeout(tick, pauseAfterWord);
                    return;
                }
            } else {
                el.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;

                if (charIndex === 0) {
                    deleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                }
            }

            timerId = setTimeout(tick, deleting ? deleteSpeed : typeSpeed);
        };

        const init = () => {
            timerId = setTimeout(tick, startDelay);

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearTimeout(timerId);
                } else {
                    timerId = setTimeout(tick, 300);
                }
            });
        };

        return { init };
    })();

    const YearModule = (() => {
        const init = () => {
            const el = $('#currentYear');
            if (el) el.textContent = new Date().getFullYear();
        };

        return { init };
    })();

    const ContactModule = (() => {
        const form = $('#contactForm');
        if (!form) return { init: () => { } };

        const status = $('#formStatus');
        const submitBtn = $('#submitBtn');
        const charCountEl = $('#charCount');
        const messageField = $('#message');
        const honeypot = $('#website');

        const maxMessageLength = CONFIG.contactForm.maxMessageLength;
        const simulatedDelay = CONFIG.contactForm.simulatedDelay;

        const validators = {
            name: (v) => {
                const value = v.trim();
                if (!value) return 'Le nom est requis.';
                if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères.';
                if (value.length > 80) return 'Le nom est trop long.';
                return '';
            },
            email: (v) => {
                const value = v.trim();
                if (!value) return "L'email est requis.";
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                if (!regex.test(value)) return 'Veuillez saisir un email valide.';
                return '';
            },
            subject: (v) => {
                const value = v.trim();
                if (!value) return 'Le sujet est requis.';
                if (value.length < 3) return 'Le sujet doit contenir au moins 3 caractères.';
                if (value.length > 120) return 'Le sujet est trop long.';
                return '';
            },
            message: (v) => {
                const value = v.trim();
                if (!value) return 'Le message est requis.';
                if (value.length < 10) return 'Le message doit contenir au moins 10 caractères.';
                if (value.length > maxMessageLength) {
                    return `Le message ne doit pas dépasser ${maxMessageLength} caractères.`;
                }
                return '';
            }
        };

        const setFieldState = (field, message) => {
            const group = field.closest('.form-group');
            if (!group) return;

            const errorEl = group.querySelector('.form-error');

            if (message) {
                group.classList.add('has-error');
                group.classList.remove('has-success');
                if (errorEl) errorEl.textContent = message;
            } else {
                group.classList.remove('has-error');
                group.classList.toggle('has-success', field.value.trim() !== '');
                if (errorEl) errorEl.textContent = '';
            }
        };

        const validateField = (field) => {
            const validator = validators[field.id];
            if (!validator) return '';
            const error = validator(field.value);
            setFieldState(field, error);
            return error;
        };

        const showStatus = (type, message) => {
            if (!status) return;
            status.className = `form-status ${type}`;
            status.innerHTML = message;
        };

        const setLoading = (isLoading) => {
            if (!submitBtn) return;
            submitBtn.classList.toggle('loading', isLoading);
            submitBtn.disabled = isLoading;
        };

        const resetForm = () => {
            form.reset();

            if (charCountEl) {
                charCountEl.textContent = '0';
                charCountEl.parentElement?.classList.remove('warning', 'danger');
            }

            $$('.form-group', form).forEach((g) =>
                g.classList.remove('has-success', 'has-error')
            );

            $$('.form-error', form).forEach((el) => (el.textContent = ''));
        };

        const simulateSend = async () => {
            const formData = new FormData(form);

            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Erreur lors de l\'envoi');
            }

            return data;
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            if (honeypot && honeypot.value) {
                return;
            }

            const fields = ['name', 'email', 'subject', 'message']
                .map((id) => $(`#${id}`))
                .filter(Boolean);

            const errors = fields.map(validateField);
            const isValid = errors.every((err) => !err);

            if (!isValid) {
                showStatus(
                    'error',
                    '<i class="fas fa-exclamation-circle"></i> Veuillez corriger les erreurs ci-dessus.'
                );
                const firstError = form.querySelector('.has-error input, .has-error textarea');
                firstError?.focus();
                return;
            }

            setLoading(true);
            showStatus('', '');

            try {
                const result = await simulateSend();
                showStatus(
                    'success',
                    '<i class="fas fa-check-circle"></i> ' + (result.message || 'Message envoyé avec succès !')
                );
                resetForm();
            }
            catch (err) {
                showStatus(
                    'error',
                    '<i class="fas fa-times-circle"></i> ' + (err.message || 'Une erreur est survenue.')
                );
            }
            finally {
                setLoading(false);
            }
        };

        const init = () => {
            const fields = ['name', 'email', 'subject', 'message']
                .map((id) => $(`#${id}`))
                .filter(Boolean);

            fields.forEach((field) => {
                field.addEventListener('blur', () => validateField(field));

                field.addEventListener('input', () => {
                    const group = field.closest('.form-group');
                    if (group?.classList.contains('has-error')) {
                        validateField(field);
                    }
                });
            });

            if (messageField && charCountEl) {
                messageField.addEventListener('input', () => {
                    const len = messageField.value.length;
                    charCountEl.textContent = len;

                    const counter = charCountEl.parentElement;
                    if (!counter) return;
                    counter.classList.toggle('warning', len > 400 && len <= maxMessageLength);
                    counter.classList.toggle('danger', len > maxMessageLength);
                });
            }

            form.addEventListener('submit', handleSubmit);
        };

        return { init };
    })();

    const SmoothScrollModule = (() => {
        const init = () => {
            if ('scrollBehavior' in document.documentElement.style) return;

            $$('a[href^="#"]').forEach((anchor) => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;

                    const target = document.querySelector(targetId);
                    if (!target) return;

                    e.preventDefault();
                    const headerHeight = $('#header')?.offsetHeight ?? 80;
                    const top = target.offsetTop - headerHeight - 10;

                    window.scrollTo({
                        top,
                        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                    });
                });
            });
        };

        return { init };
    })();

    const bootstrap = () => {
        const modules = [
            PreloaderModule,
            ThemeModule,
            MenuModule,
            ScrollModule,
            RevealModule,
            CounterModule,
            TypingModule,
            YearModule,
            ContactModule,
            SmoothScrollModule
        ];

        modules.forEach((module) => {
            try {
                module.init();
            } catch {
                return;
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();