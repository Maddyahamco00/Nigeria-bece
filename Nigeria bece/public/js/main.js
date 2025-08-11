// public/js/main.js
// General client-side scripts for the application
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle for mobile
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
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
        if (!input.value) {
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