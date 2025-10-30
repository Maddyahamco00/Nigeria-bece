// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Theme (light/dark) handling
  const applyTheme = (theme) => {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      body.classList.remove('bg-light');
      body.classList.add('bg-dark');
      const icon = document.getElementById('themeIcon');
      if (icon) icon.className = 'bi bi-sun-fill';
    } else {
      body.classList.remove('dark-mode');
      body.classList.remove('bg-dark');
      body.classList.add('bg-light');
      const icon = document.getElementById('themeIcon');
      if (icon) icon.className = 'bi bi-moon-fill';
    }
  };

  // Initialize theme from localStorage or system preference
  const stored = localStorage.getItem('nb_theme');
  if (stored) {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  // Toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('nb_theme', newTheme);
    });
  }
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

      if (!valid) {
        e.preventDefault();
        alert('Please fill all required fields.');
      }
    });
  });
});
