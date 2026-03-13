/* main.js — Bootstrap, scroll animations, header, nav */

document.addEventListener('DOMContentLoaded', function () {

  // ── Header scroll effect ─────────────────────────────────
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── Mobile hamburger ─────────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded',
        navLinks.classList.contains('open').toString());
    });

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!header.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // ── IntersectionObserver fade-in ─────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, entry.target.dataset.delay || 0);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in, .fade-in-left').forEach((el, i) => {
    // Stagger siblings
    const parent = el.parentElement;
    const siblings = parent.querySelectorAll('.fade-in, .fade-in-left');
    const idx = Array.from(siblings).indexOf(el);
    el.dataset.delay = idx * 80;
    observer.observe(el);
  });

  // ── Smooth scroll for anchor links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Active nav link highlight ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"]');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navItems.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => navObserver.observe(s));

  // ── Toast system ──────────────────────────────────────────
  window.showToast = function (message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ── tsParticles ───────────────────────────────────────────
  if (window.tsParticles && document.getElementById('particles-canvas')) {
    tsParticles.load('particles-canvas', {
      particles: {
        number: { value: 60, density: { enable: true, area: 800 } },
        color: { value: ['#00d4ff', '#862633', '#ffffff'] },
        opacity: { value: 0.25, random: true,
          animation: { enable: true, speed: 0.5, minimumValue: 0.05, sync: false } },
        size: { value: { min: 1, max: 3 }, random: true },
        links: {
          enable: true,
          distance: 140,
          color: '#00d4ff',
          opacity: 0.08,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.4,
          direction: 'none',
          random: true,
          straight: false,
          outModes: 'out'
        }
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'grab' },
          onClick: { enable: true, mode: 'push' }
        },
        modes: {
          grab: { distance: 120, links: { opacity: 0.3 } },
          push: { quantity: 3 }
        }
      },
      detectRetina: true,
      background: { color: 'transparent' }
    });
  }

  // ── Typed.js ──────────────────────────────────────────────
  const typedEl = document.getElementById('typed-target');
  if (window.Typed && typedEl) {
    new Typed('#typed-target', {
      strings: [
        'for high school math teachers.',
        'powered by ChatGPT, Claude & Gemini.',
        'with 57 ready-to-use prompts.',
        'at CSUDH LIFT LAB — March 17, 2026.',
        'no coding experience required.'
      ],
      typeSpeed: 40,
      backSpeed: 20,
      backDelay: 2400,
      loop: true,
      cursorChar: '|'
    });
  }

  // ── GSAP scroll animations (tool cards stagger) ───────────
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.tool-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        delay: i * 0.12,
        ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.agenda-item').forEach((item, i) => {
      gsap.from(item, {
        scrollTrigger: { trigger: item, start: 'top 88%' },
        opacity: 0,
        x: -20,
        duration: 0.5,
        delay: i * 0.08,
        ease: 'power2.out'
      });
    });
  }

});
