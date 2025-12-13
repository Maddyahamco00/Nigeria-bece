# 🚀 Quick Deployment Steps

## 1. Clever Cloud Database Setup
1. Go to [clever-cloud.com](https://clever-cloud.com) → Create MySQL add-on
2. Copy these credentials to Render:
   - `MYSQL_ADDON_HOST`
   - `MYSQL_ADDON_USER`
   - `MYSQL_ADDON_PASSWORD`
   - `MYSQL_ADDON_DB`

## 2. Render App Deployment
1. Go to [render.com](https://render.com) → New Web Service
2. Connect this GitHub repo
3. Set Build Command: `npm ci`
4. Set Start Command: `npm start`
5. Add environment variables from `.env.render` file

## 3. Required Environment Variables
```
MYSQL_ADDON_HOST=your_clever_cloud_host
MYSQL_ADDON_USER=your_clever_cloud_user
MYSQL_ADDON_PASSWORD=your_clever_cloud_password
MYSQL_ADDON_DB=your_clever_cloud_db
NODE_ENV=production
SESSION_SECRET=your_random_secret
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public
```

## 4. Test Deployment
- Visit your Render URL
- Test admin login at `/auth/login`
- Test student registration at `/`

Your app will auto-deploy on every GitHub push! 🎉