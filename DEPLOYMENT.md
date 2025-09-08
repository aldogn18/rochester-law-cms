# Rochester Law CMS - Deployment Guide

## Overview
This guide covers deploying the Rochester Law CMS to production using Railway or Vercel.

## Prerequisites
- GitHub repository with your code
- Railway or Vercel account
- PostgreSQL database (provided by platform or external)

## Option 1: Deploy to Railway

Railway provides both hosting and PostgreSQL database in one platform.

### 1. Setup Railway Project
1. Go to [Railway](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `rochester-law-cms` repository

### 2. Add PostgreSQL Database
1. In your Railway project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision a PostgreSQL instance
4. The `DATABASE_URL` will be automatically available as `${{Postgres.DATABASE_URL}}`

### 3. Configure Environment Variables
In Railway dashboard, go to your service → "Variables" and add:
- `NODE_ENV`: `production`
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Will be auto-set to `${{Railway.PUBLIC_DOMAIN}}`

The `railway.toml` file is already configured in your project.

### 4. Deploy
1. Push your code to GitHub
2. Railway will automatically deploy
3. Visit the provided URL to access your app

### 5. Initialize Database
After first deployment, run database migrations:
```bash
npx prisma db push
```

## Option 2: Deploy to Vercel

Vercel requires an external PostgreSQL database (like Supabase, Neon, or PlanetScale).

### 1. Setup External Database
Choose one:
- **Supabase**: Free PostgreSQL with 500MB storage
- **Neon**: Serverless PostgreSQL with generous free tier
- **PlanetScale**: MySQL-compatible (requires schema changes)
- **Railway**: Just use their database service

### 2. Deploy to Vercel
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js and configure build settings

### 3. Configure Environment Variables
In Vercel dashboard → Project → Settings → Environment Variables, add:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NODE_ENV`: `production`

### 4. Initialize Database
After deployment, initialize your database:
```bash
npx prisma db push
```

## Database Migration Commands

For both platforms, you may need to run these commands:

### Generate Prisma Client
```bash
npx prisma generate
```

### Push Schema to Database
```bash
npx prisma db push
```

### Reset Database (if needed)
```bash
npx prisma db push --force-reset
```

## Environment Variables Reference

Required for production:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your app's public URL
- `NEXTAUTH_SECRET`: Random 32-character string for JWT encryption
- `NODE_ENV`: Set to `production`

Optional:
- Email provider variables (for notifications)
- AWS S3 variables (for file storage)
- Search service variables

## Post-Deployment Checklist

1. **Test Authentication**: Ensure login/logout works
2. **Test Database**: Create a test case, event, or document
3. **Check File Uploads**: Test document upload functionality
4. **Verify Security**: Ensure confidential data is properly protected
5. **Monitor Logs**: Check for any errors in platform logs

## Troubleshooting

### Common Issues

**Build Fails**: 
- Check that all dependencies are in `package.json`
- Ensure TypeScript errors are resolved

**Database Connection Error**:
- Verify `DATABASE_URL` is correct
- Ensure database allows external connections
- Check firewall/security group settings

**Authentication Issues**:
- Verify `NEXTAUTH_URL` matches your domain
- Ensure `NEXTAUTH_SECRET` is set and secure

**Module Not Found**:
- Run `npm install` to ensure all dependencies are installed
- Check for typos in import statements

### Platform-Specific Issues

**Railway**:
- Build timeout: Increase build timeout in project settings
- Memory issues: Upgrade to a larger plan if needed

**Vercel**:
- Function timeout: Upgrade to Pro plan for longer function execution
- Cold starts: Consider keeping functions warm with scheduled requests

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Database Access**: Use connection pooling for production
3. **HTTPS**: Both platforms provide SSL/TLS by default
4. **CORS**: Configure proper CORS settings if needed
5. **Rate Limiting**: Consider implementing rate limiting for API routes

## Monitoring & Maintenance

1. **Error Tracking**: Consider adding Sentry or similar service
2. **Performance Monitoring**: Use platform analytics
3. **Database Backups**: Ensure automated backups are enabled
4. **Updates**: Regularly update dependencies
5. **Security**: Monitor for security vulnerabilities

## Support

- Railway: [Railway Docs](https://docs.railway.app)
- Vercel: [Vercel Docs](https://vercel.com/docs)
- Prisma: [Prisma Docs](https://www.prisma.io/docs)
- Next.js: [Next.js Docs](https://nextjs.org/docs)
