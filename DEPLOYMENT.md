# 🚀 Deployment Guide: Clever Cloud + Render

This guide walks you through deploying your Nigeria BECE application with:
- **Database**: Clever Cloud MySQL
- **Application**: Render Web Service

---

## 🗄️ Part 1: Deploy Database on Clever Cloud

### 1. Create Clever Cloud Account
1. Go to [Clever Cloud](https://www.clever-cloud.com/)
2. Sign up or log in
3. Create a new organization (if needed)

### 2. Create MySQL Add-on
1. Click **"Create an application"**
2. Select **"Add-on"**
3. Choose **"MySQL"**
4. Select plan (DEV for testing, PRO for production)
5. Name it: `nigeria-bece-db`
6. Click **"Create"**

### 3. Get Database Credentials
After creation, go to **Environment Variables** tab and note:
- `MYSQL_ADDON_HOST`
- `MYSQL_ADDON_USER` 
- `MYSQL_ADDON_PASSWORD`
- `MYSQL_ADDON_DB`
- `MYSQL_ADDON_PORT` (usually 3306)

---

## 🌐 Part 2: Deploy Application on Render

### 1. Create Render Account
1. Go to [Render](https://render.com/)
2. Sign up with GitHub
3. Connect your GitHub account

### 2. Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `nigeria-bece`
   - **Branch**: `main`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for production)

### 3. Set Environment Variables
In Render dashboard, go to **Environment** tab and add:

```bash
# Database (from Clever Cloud)
MYSQL_ADDON_HOST=your_clever_cloud_host
MYSQL_ADDON_USER=your_clever_cloud_user
MYSQL_ADDON_PASSWORD=your_clever_cloud_password
MYSQL_ADDON_DB=your_clever_cloud_db_name
MYSQL_ADDON_PORT=3306

# Application
NODE_ENV=production
PORT=10000
SESSION_SECRET=your_secure_random_string

# Paystack (get from paystack.com)
PAYSTACK_SECRET_KEY=sk_live_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# SMS (optional - Termii)
SMS_API_KEY=your_termii_api_key
SMS_SENDER=BECE-NG
SMS_BASE_URL=https://api.ng.termii.com/api/sms/send
```

### 4. Deploy
1. Click **"Create Web Service"**
2. Render will automatically deploy from your GitHub repo
3. Wait for build to complete (~5-10 minutes)

---

## 🔧 Part 3: Post-Deployment Setup

### 1. Initialize Database
Once deployed, run database initialization:
```bash
# Access your Render service shell or run locally with production DB
npm run setup
npm run create-admin
```

### 2. Test the Application
1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Test admin login: `/auth/login`
3. Test student registration: `/`
4. Test payment flow

### 3. Configure Custom Domain (Optional)
In Render dashboard:
1. Go to **Settings** → **Custom Domains**
2. Add your domain (e.g., `bece.gov.ng`)
3. Update DNS records as instructed

---

## 🔐 Security Checklist

- [ ] Use strong `SESSION_SECRET`
- [ ] Use production Paystack keys
- [ ] Enable SSL (automatic on Render)
- [ ] Set up proper email credentials
- [ ] Configure CORS if needed
- [ ] Set up monitoring/logging

---

## 📊 Monitoring & Maintenance

### Render Monitoring
- Check **Logs** tab for errors
- Monitor **Metrics** for performance
- Set up **Health Checks**

### Clever Cloud Monitoring
- Monitor database performance
- Check connection limits
- Review query logs

### Regular Tasks
- Database backups (Clever Cloud auto-backup)
- Update dependencies
- Monitor payment transactions
- Review user registrations

---

## 🚨 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check environment variables
echo $MYSQL_ADDON_HOST
# Test connection from Render shell
```

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Review build logs in Render

**Payment Issues**
- Verify Paystack keys
- Check webhook URLs
- Test in sandbox mode first

### Support
- **Render**: [docs.render.com](https://docs.render.com)
- **Clever Cloud**: [doc.clever-cloud.com](https://doc.clever-cloud.com)
- **Paystack**: [paystack.com/docs](https://paystack.com/docs)

---

## 💰 Cost Estimation

### Clever Cloud MySQL
- **DEV**: €0/month (limited)
- **S**: €7.20/month
- **M**: €19.80/month

### Render Web Service
- **Free**: $0/month (sleeps after 15min)
- **Starter**: $7/month
- **Standard**: $25/month

**Total Monthly Cost**: ~$14-32 for production setup

---

## 🔄 Auto-Deployment

Your app will auto-deploy when you push to GitHub:

```bash
git add .
git commit -m "Update application"
git push origin main
```

Render will automatically rebuild and deploy! 🎉