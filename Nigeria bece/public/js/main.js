// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle (supports both #sidebarToggle/#sidebar and .sidebar-toggle/.sidebar)
  const toggleBtn = document.getElementById('sidebarToggle') || document.querySelector('.sidebar-toggle');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('closed');
      sidebar.classList.toggle('hidden');
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
