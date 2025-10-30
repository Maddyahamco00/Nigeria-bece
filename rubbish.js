/*# .env

# Server Configuration
PORT=3000
NODE_ENV=development

# MySQL Database Configuration

DB_USER=root
DB_PASSWORD="1234567890#"
DB_HOST=localhost
DB_NAME=nigeria_bece_db

# Session Secret
SESSION_SECRET=maddy

# Paystack API Keys
PAYSTACK_SECRET_KEY=sk_test_8e34251ab4a825a3516648d6878d420bc06a90e8
PAYSTACK_PUBLIC_KEY=pk_test_459ec26b716655348ae00e8403393696999e59a0

# Email Configuration (Optional, e.g., for Nodemailer)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# SMS Configuration (Optional, e.g., for Termii or Twilio)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=BECE_NG

#Replace `your_mysql_password`, `your_session_secret_here`, `sk_test_your_paystack_secret_key`, and `pk_test_your_paystack_public_key` with actual values.
#- The email and SMS configurations are optional and depend on whether you use services like Nodemailer or an SMS provider (e.g., Termii, Twilio).
#- Ensure the `.env` file is added to `.gitignore` to prevent exposing sensitive data. 






curl https://api.paystack.co/transaction/initialize \
-H "Authorization: Bearer sk_test_8e34251ab4a825a3516648d6878d420bc06a90e8" \
-H "Content-Type: application/json" \
-d '{"email":"maddyahamco00@gmail.com","amount":500000}' 




====================login====================
<%- include('../partials/head', { title: 'Student Login' }) %>
<%- include('../partials/header') %>

<main class="max-w-lg mx-auto mt-12 p-8 bg-white rounded-lg shadow">
  <h1 class="text-2xl font-bold mb-6">Login</h1>
  <% if (typeof error !== 'undefined') { %>
    <p class="text-red-500 mb-4"><%= error %></p>
  <% } %>
  <form action="/students/login" method="POST" class="space-y-4">
    <input type="text" name="code" placeholder="Enter PIN/BECE Code" required class="w-full border p-2 rounded">
    <button type="submit" class="w-full bg-green-600 text-white py-2 rounded">Login</button>
  </form>
</main>

<%- include('../partials/footer') %>







===========================reg======================
<%- include('../partials/head', { title: 'Register Student' }) %>
<%- include('../partials/header') %>
<%- include('../partials/sidebar') %>

<main class="ml-64 p-6">
  <h2 class="text-2xl font-bold mb-6">Register Student</h2>

  <% if (messages.success) { %>
    <p class="text-green-600"><%= messages.success %></p>
  <% } %>

  <% if (errors.length > 0) { %>
    <ul class="text-red-600">
      <% errors.forEach(e => { %>
        <li><%= e.msg %></li>
      <% }) %>
    </ul>
  <% } %>

  <form method="POST" action="/student/register" class="space-y-4">
    <div>
      <label class="block">Full Name</label>
      <input type="text" name="name" class="border p-2 w-full" value="<%= data.name || '' %>">
    </div>

    <div>
      <label class="block">Email</label>
      <input type="email" name="email" class="border p-2 w-full" value="<%= data.email || '' %>">
    </div>

    <div>
      <label class="block">Student Code</label>
      <input type="text" name="studentCode" class="border p-2 w-full" value="<%= data.studentCode || '' %>">
    </div>

    <div>
      <label class="block">Gender</label>
      <select name="gender" class="border p-2 w-full">
        <option value="">--Select--</option>
        <option value="Male" <%= data.gender === 'Male' ? 'selected' : '' %>>Male</option>
        <option value="Female" <%= data.gender === 'Female' ? 'selected' : '' %>>Female</option>
      </select>
    </div>

    <div>
      <label class="block">Date of Birth</label>
      <input type="date" name="dateOfBirth" class="border p-2 w-full" value="<%= data.dateOfBirth || '' %>">
    </div>

    <div>
      <label class="block">Guardian Phone</label>
      <input type="text" name="guardianPhone" class="border p-2 w-full" value="<%= data.guardianPhone || '' %>">
    </div>

    <div>
      <label class="block">School</label>
      <select name="schoolId" class="border p-2 w-full">
        <% schools.forEach(school => { %>
          <option value="<%= school.id %>"><%= school.name %></option>
        <% }) %>
      </select>
    </div>

    <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
  </form>
</main>

<%- include('../partials/footer') %>












'===========================css======================
Email: superadmin@bece.gov.ng

Password: admin123

'''''''''''''''''''''''''''''''''''''''''''''''''''''




/views  
 ├── layouts/  
 │    └── main.ejs  
 ├── partials/  
 │    ├── head.ejs  
 │    ├── header.ejs  
 │    └── footer.ejs  
 ├── auth/  
 │    ├── student-login.ejs  
 │    ├── student-register.ejs  
 │    └── admin-login.ejs  
 ├── dashboard/  
 │    ├── admin-dashboard.ejs  
 │    └── student-dashboard.ejs  
 └── landing.ejs  
  
  
I want new for all to copy ( well organized and add sidebar{ for student and for admin all after login}, make superadmin@gmail.com to be the only email for login and admin123 as password) then we move to dashboard and profile for both students and admin 







, , 


*/