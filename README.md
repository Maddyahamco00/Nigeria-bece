# Nigeria BECE Admin Portal

The **Nigeria BECE Admin Portal** is a web application for managing student registrations, schools, payments, and results for the Basic Education Certificate Examination (BECE) in Nigeria. Built with **Node.js**, **Express.js**, **MySQL**, and **Paystack** for payments.

## Features
- Admin dashboard for managing students, schools, and results.
- Secure authentication (Passport.js).
- Paystack integration for payment processing.
- Public pages for payments and information.
- Responsive design with custom CSS.

## Technologies
- **Backend**: Node.js, Express.js  
- **Database**: MySQL  
- **Payment**: Paystack  
- **Auth**: Passport.js  
- **Templating**: EJS  

## Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/nigeria-bece-admin.git
   cd nigeria-bece-admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up MySQL database named `nigeria_bece_db`.
4. Create `.env` file (copy from `.env.example` and fill your keys).
5. Start the server:
   ```bash
   npm start  # Production
   npm run dev  # Development
   ```

## Environment Variables
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

## Usage
- **Public**: Access `/` (landing), `/payment` (Paystack), `/success` (confirmation).  
- **Admin**: Log in at `/auth/login`, manage data at `/admin/dashboard`.  

## Directory Structure
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

## License
MIT License. See [LICENSE](LICENSE).

