/*
# 🇳🇬 Nigeria BECE Admin & Student Portal

This repository contains the full-stack web application for managing student registrations, schools, payments, and results for the **Basic Education Certificate Examination (BECE)** in Nigeria. Built with **Node.js**, **Express**, **EJS**, **Sequelize (MySQL)**, and **Paystack** for payments.

---

## 🚀 Features

- Admin dashboard for managing students, schools, and results  
- Secure authentication with Passport.js  
- Paystack integration for payment processing  
- Public-facing pages for payments and information  
- Responsive design with custom CSS  
- Continuous Integration via GitHub Actions  
- Optional Docker support  
- Easy deployment to Render

---

## 🧰 Technologies

| Layer       | Stack                     |
|------------|---------------------------|
| Backend     | Node.js, Express.js       |
| Database    | MySQL, Sequelize ORM      |
| Auth        | Passport.js               |
| Payment     | Paystack                  |
| Templating  | EJS                       |
| CI/CD       | GitHub Actions            |
| Deployment  | Render / Docker           |

---

## 🖥️ Local Development

1. **Clone the repo**  
   ```bash
   git clone https://github.com/Maddyahamco00/Nigeria-bece.git
   cd nigeria-bece-admin
   ```

2. **Install dependencies**  
   ```powershell
   npm ci
   ```

3. **Set up MySQL database**  
   Create a database named `nigeria_bece_db`.

4. **Create `.env` file**  
   Copy from `.env.example` and fill in your credentials:

   ```plaintext
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=nigeria_bece_db
   PAYSTACK_SECRET_KEY=your_paystack_secret
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   SESSION_SECRET=your_session_secret
   ```

5. **Start the server**  
   ```powershell
   npm run dev  # Development
   npm start    # Production
   ```

App runs at [http://localhost:3000](http://localhost:3000)

---

## 📁 Directory Structure

```
nigeria-bece-admin/
├── config/       # DB, Passport, States
├── controllers/  # Logic handlers
├── models/       # DB schemas
├── public/       # CSS, JS, images
├── routes/       # API routes
├── views/        # EJS templates
├── .env          # Environment vars
└── app.js        # Main app file
```

---

## 🔐 Usage

- **Public Pages**: `/`, `/payment`, `/success`  
- **Admin Portal**: `/auth/login`, `/admin/dashboard`, `/admin/students`

---

## ☁️ Deployment to Render

1. Sign up at [Render](https://render.com) and connect your GitHub.
2. Create a new **Web Service** and select this repo.
3. Use these settings:
   - Build Command: `npm ci`
   - Start Command: `npm start`
   - Instance Port: `3000`
4. Add environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SESSION_SECRET`, etc.

Render will auto-deploy on every push to the connected branch.

---

## 🐳 Optional: Docker

A `Dockerfile` is included for container-based deployment.

---

## 🔄 GitHub Setup

If not yet connected to GitHub:

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Maddyahamco00/Nigeria-bece.git
git branch -M main
git push -u origin main
```

To push updates:

```powershell
git add .
git commit -m "Your concise message"
git push
```

---

## ⚙️ Continuous Integration

A basic GitHub Actions workflow is included. It runs:

- `npm ci`
- `npm test` (if present)

Triggers on pushes and pull requests.

---

## 📌 License

MIT License. See [LICENSE](LICENSE).
*/