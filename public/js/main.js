// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Theme (light/dark) handling
  const applyTheme = (theme) => {
    const body = document.body;
    const icon = document.getElementById('theme-icon');

    // Remove existing theme styles
    const existingStyle = document.getElementById('theme-override-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      if (icon) icon.className = 'fas fa-sun';

      // Inject immediate style override
      const style = document.createElement('style');
      style.id = 'theme-override-style';
      style.textContent = `
        body * {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
          border-color: #404040 !important;
        }
        body {
          color: #e0e0e0 !important;
          border-color: #404040 !important;
        }
        .card, .card-header, .card-body, .table, .navbar, .sidebar {
          background-color: #2d2d2d !important;
          color: #e0e0e0 !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
      if (icon) icon.className = 'fas fa-moon';

      // Inject immediate style override for light theme
      const style = document.createElement('style');
      style.id = 'theme-override-style';
      style.textContent = `
        body * {
          background-color: #ffffff !important;
          color: #212529 !important;
          border-color: #dee2e6 !important;
        }
        body {
          color: #212529 !important;
          border-color: #dee2e6 !important;
        }
        .card, .card-header, .card-body, .table, .navbar, .sidebar {
          background-color: #ffffff !important;
          color: #212529 !important;
        }
      `;
      document.head.appendChild(style);
    }
  };

  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    const stored = localStorage.getItem('nb_theme');
    let themeToApply = 'light'; // default

    if (stored) {
      themeToApply = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeToApply = 'dark';
      localStorage.setItem('nb_theme', 'dark');
    } else {
      localStorage.setItem('nb_theme', 'light');
    }

    applyTheme(themeToApply);
  };

  // Initialize immediately
  initTheme();

  // Global toggleTheme function
  window.toggleTheme = () => {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('nb_theme', newTheme);
  };

  // Global toggleSidebar function
  window.toggleSidebar = () => {
    const sidebar = document.querySelector('.modern-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  };
  // Sidebar toggle (supports both #sidebarToggle/#sidebar and .sidebar-toggle/.sidebar)
  const toggleBtn = document.getElementById('sidebarToggle') || document.querySelector('.sidebar-toggle');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');

  // Use the 'open' class for mobile off-canvas visibility (matches CSS)
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // toggle both possible helpers for compatibility with older styles
      sidebar.classList.toggle('open');
      sidebar.classList.toggle('show');
      // clean up legacy classes if present
      sidebar.classList.remove('closed', 'hidden');
    });

    // Close sidebar when clicking outside on small screens
    document.addEventListener('click', (ev) => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      if (!isMobile) return; // only relevant on mobile
      if (!sidebar.classList.contains('open')) return;
      const target = ev.target;
      if (!sidebar.contains(target) && target !== toggleBtn && !toggleBtn.contains(target)) {
        sidebar.classList.remove('open', 'show');
      }
    });
  }

  // Form validation for auth pages
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const inputs = form.querySelectorAll('input[required]');
      let valid = true;

      inputs.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.classList.add('border-red-500');
        } else {
          input.classList.remove('border-red-500');
        }
      });

  // Password Strength Meter
  const passwordInput = document.getElementById('password');
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');

  if (passwordInput && strengthFill && strengthText) {
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      const strength = calculatePasswordStrength(password);
      updatePasswordStrengthMeter(strength);
    });
  }

  function calculatePasswordStrength(password) {
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return score;
  }

  function updatePasswordStrengthMeter(score) {
    const fill = strengthFill;
    const text = strengthText;

    // Remove all classes
    fill.className = 'strength-fill';

    if (score <= 2) {
      fill.style.width = '25%';
      fill.classList.add('weak');
      text.textContent = 'Password strength: Weak';
      text.style.color = '#dc3545';
    } else if (score <= 4) {
      fill.style.width = '50%';
      fill.classList.add('fair');
      text.textContent = 'Password strength: Fair';
      text.style.color = '#ffc107';
    } else if (score <= 5) {
      fill.style.width = '75%';
      fill.classList.add('good');
      text.textContent = 'Password strength: Good';
      text.style.color = '#28a745';
    } else {
      fill.style.width = '100%';
      fill.classList.add('strong');
      text.textContent = 'Password strength: Strong';
      text.style.color = '#20c997';
    }
  }

  // Loading Indicators
  function showLoading(button) {
    if (!button) return;

    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span>Loading...';
    button.classList.add('btn-loading');
  }

  function hideLoading(button, originalText) {
    if (!button) return;

    button.disabled = false;
    button.innerHTML = originalText;
    button.classList.remove('btn-loading');
  }

  // Global loading functions
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;

  // Auto-apply loading to forms
  document.addEventListener('submit', function(e) {
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

    if (submitBtn && !submitBtn.classList.contains('no-loading')) {
      const originalText = submitBtn.innerHTML;
      showLoading(submitBtn);

      // Store original text for restoration
      submitBtn.setAttribute('data-original-text', originalText);
    }
  });

  // Page Loading Overlay
  function showPageLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'pageLoadingOverlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function hidePageLoading() {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // Global page loading functions
  window.showPageLoading = showPageLoading;
  window.hidePageLoading = hidePageLoading;

  // Hide page loading on page load
  window.addEventListener('load', function() {
    setTimeout(hidePageLoading, 500); // Small delay for smooth transition
  });

  // Show page loading on navigation
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href]');
    if (link && !link.hasAttribute('data-no-loading') && link.hostname === window.location.hostname) {
      showPageLoading();
    }
  });
