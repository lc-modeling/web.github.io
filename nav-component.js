/*
 * <site-nav> - one reusable header/navigation Web Component shared by every
 * public page. Single source of truth for the link list, the "Menu" toggle,
 * and the full-screen mobile panel, so every page behaves identically.
 */
(function () {
  const LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'programs.html', label: 'Programs' },
    { href: 'models.html', label: 'Get Scouted' },
    { href: 'modelconnect.html', label: 'Model Connect' },
    { href: 'model.html', label: 'Models Management' },
    { href: 'homecoaching.html', label: 'Home Coaching' },
    { href: 'models.html#online-classes', label: 'Online Classes' },
    { href: 'blog.html', label: 'Blog' },
    { href: 'register.html', label: 'Enroll', variant: 'cta' },
    { href: 'loginform.html', label: 'Sign In', variant: 'signin' }
  ];

  function currentFile() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1);
    return file || 'index.html';
  }

  function linkFile(href) {
    return href.split('#')[0] || 'index.html';
  }

  function renderLinks(links, { active, extraClass }) {
    return links.map(link => {
      const classes = [];
      if (link.variant === 'cta') classes.push('sn__cta');
      if (link.variant === 'signin') classes.push('sn__signin');
      if (extraClass) classes.push(extraClass);
      if (linkFile(link.href) === active) classes.push('is-active');
      const cls = classes.length ? ` class="${classes.join(' ')}"` : '';
      const current = linkFile(link.href) === active ? ' aria-current="page"' : '';
      return `<a href="${link.href}"${cls}${current}>${link.label}</a>`;
    }).join('');
  }

  class SiteNav extends HTMLElement {
    connectedCallback() {
      const active = this.getAttribute('current') || currentFile();

      this.innerHTML = `
        <header class="sn" id="snHeader">
          <div class="sn__bar">
            <a class="sn__brand" href="index.html"><span>L&amp;C</span>&nbsp;MODELING</a>
            <nav class="sn__desktop" aria-label="Primary">
              ${renderLinks(LINKS, { active })}
            </nav>
            <button type="button" class="sn__toggle" id="snToggle" aria-expanded="false" aria-controls="snPanel" aria-label="Open menu">
              <span class="sn__toggle-dot"></span>
              <span class="sn__toggle-text">Menu</span>
            </button>
          </div>
        </header>
        <div class="sn__backdrop" id="snBackdrop"></div>
        <nav class="sn__panel" id="snPanel" aria-label="Mobile" aria-hidden="true">
          <div class="sn__panel-links">
            ${renderLinks(LINKS, { active })}
          </div>
        </nav>
      `;

      this.header = this.querySelector('#snHeader');
      this.toggle = this.querySelector('#snToggle');
      this.toggleText = this.querySelector('.sn__toggle-text');
      this.panel = this.querySelector('#snPanel');
      this.backdrop = this.querySelector('#snBackdrop');

      this.onScroll = this.onScroll.bind(this);
      this.onKeydown = this.onKeydown.bind(this);

      this.toggle.addEventListener('click', () => this.toggleMenu());
      this.backdrop.addEventListener('click', () => this.closeMenu());
      this.panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => this.closeMenu()));

      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.onScroll();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('keydown', this.onKeydown);
    }

    onScroll() {
      this.header.classList.toggle('is-scrolled', window.scrollY > 20);
    }

    onKeydown(e) {
      if (e.key === 'Escape') this.closeMenu();
    }

    toggleMenu() {
      const isOpen = this.toggle.getAttribute('aria-expanded') === 'true';
      isOpen ? this.closeMenu() : this.openMenu();
    }

    openMenu() {
      this.toggle.setAttribute('aria-expanded', 'true');
      this.toggle.setAttribute('aria-label', 'Close menu');
      this.toggleText.textContent = 'Close';
      this.panel.classList.add('is-open');
      this.panel.setAttribute('aria-hidden', 'false');
      this.backdrop.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      document.addEventListener('keydown', this.onKeydown);
    }

    closeMenu() {
      this.toggle.setAttribute('aria-expanded', 'false');
      this.toggle.setAttribute('aria-label', 'Open menu');
      this.toggleText.textContent = 'Menu';
      this.panel.classList.remove('is-open');
      this.panel.setAttribute('aria-hidden', 'true');
      this.backdrop.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', this.onKeydown);
    }
  }

  if (!customElements.get('site-nav')) {
    customElements.define('site-nav', SiteNav);
  }
})();
