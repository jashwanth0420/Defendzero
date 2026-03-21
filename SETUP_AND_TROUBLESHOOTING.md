# DefendZero - Complete Setup & Troubleshooting Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- Redis server

### Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend root:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/defendzero
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key_here_change_in_production
GOOGLE_CLIENT_ID=your_google_client_id
```

Initialize database:
```bash
npx prisma migrate dev
npx prisma db seed
```

Start backend:
```bash
npm run dev
```

Expected output:
```
[DefendZero] Server running on port 5000
```

Test health endpoint:
```bash
curl http://localhost:5000/health
```

Response should be:
```json
{
  "success": true,
  "status": "DefendZero App Framework is alive.",
  "timestamp": "2026-03-21T..."
}
```

### Step 2: Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` file in frontend root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Start frontend:
```bash
npm run dev
```

Expected output:
```
> ▲ Next.js 15.x.x
> - Local: http://localhost:3000
```

### Step 3: Login Flow Test

1. Open browser: `http://localhost:3000`
2. Click "I Understand & Agree" on disclaimer
3. Select role (USER, DOCTOR, GUARDIAN, or PHARMACY)
4. Enter test credentials
5. Should see dashboard

---

## 🔧 Troubleshooting

### Issue: GET /dashboard 404

**Status:** ✅ FIXED (missing layout.tsx file)

**What was wrong:**
- The `(dashboard)` route group was missing `layout.tsx`
- Without it, Next.js couldn't render protected routes

**Solution Applied:**
- Created `frontend/src/app/(dashboard)/layout.tsx`
- Handles authentication check and navigation

**Verify fix:**
```bash
# Check file exists
ls -la frontend/src/app/\(dashboard\)/layout.tsx

# Should show file size > 0
```

---

### Issue: Login Endpoint 404

**Symptoms:**
```
POST /api/v1/auth/login 404
```

**Causes & Fixes:**

#### 1. Backend not running
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Verify endpoint exists
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### 2. Database connection failed
```bash
# Check PostgreSQL is running
psql -U postgres -d defendzero

# Verify migrations applied
npx prisma migrate status

# If pending, run:
npx prisma migrate dev
```

#### 3. Wrong API_URL in frontend
```bash
# Check frontend .env.local
cat frontend/.env.local

# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1

# If wrong, update and restart frontend:
npm run dev
```

---

### Issue: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
```bash
# Check backend has CORS enabled (in app.ts)
grep -n "cors()" backend/src/app.ts

# Should show:
# Line X: app.use(cors());

# Verify frontend URL matches backend config
# Backend has cors() with no restrictions by default
```

---

### Issue: JWT Token Invalid

**Symptoms:**
```
401 Unauthorized: Invalid or expired token
```

**Solutions:**

1. **Clear browser storage:**
   ```javascript
   // Open DevTools > Console
   localStorage.clear();
   sessionStorage.clear();
   // Refresh page
   ```

2. **Check JWT Secret matches:**
   ```bash
   # Backend .env
   echo $JWT_SECRET

   # Should be consistent across restarts
   ```

3. **Token expired (valid but old):**
   ```bash
   # Login again to get fresh token
   # Tokens expire after 1 day
   ```

---

### Issue: API Response Structure Error

**Symptoms:**
```
Error: Authentication response missing tokens
```

**Cause:**
Backend not returning `{ success, data, tokens }` structure

**Fix:**
```bash
# Test login endpoint manually
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"test123"}'

# Response should be:
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "role": "DOCTOR",
    ...
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Issue: Dashboard Routes Not Found

**Symptoms:**
- Click sidebar link but page doesn't load
- Still shows 404

**Solutions:**

1. **Check role-specific pages exist:**
   ```bash
   ls -la frontend/src/app/\(dashboard\)/
   
   # Should show:
   # layout.tsx ✓
   # dashboard/page.tsx ✓
   # doctor/page.tsx ✓
   # user/page.tsx ✓
   # guardian/page.tsx ✓
   # pharmacy/page.tsx ✓
   ```

2. **Verify authentication check:**
   ```bash
   # Open DevTools > Storage
   # Should have:
   # defendzero_token
   # defendzero_role
   # defendzero_refreshToken
   
   # If missing, login again
   ```

3. **Check role value matches:**
   ```javascript
   // DevTools > Console
   localStorage.getItem('defendzero_role')
   // Should output: "USER", "DOCTOR", "GUARDIAN", or "PHARMACY"
   ```

---

### Issue: Sidebar Not Showing

**Causes:**
1. Authentication check failing
2. Role not set in localStorage
3. Layout not rendering

**Debug:**
```bash
# Open DevTools > Network
# Check /dashboard request
# Should see 200 OK

# Open DevTools > Console
# Should show no errors

# Check localStorage
localStorage.getItem('defendzero_role')
```

---

### Issue: Cannot Save Tokens

**Symptoms:**
- Login success but token not saved
- Get redirected back to roles page

**Causes:**
1. localStorage disabled
2. Private/Incognito mode
3. Browser security policy

**Solutions:**
```bash
# Test localStorage in console
localStorage.setItem('test', 'value')
console.log(localStorage.getItem('test'))

# Enable cookies/storage if using Private mode
# Try different browser or disable extensions
```

---

## 📊 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors  
- [ ] Health endpoint responds: `http://localhost:5000/health`
- [ ] Role selection page loads: `http://localhost:3000/roles`
- [ ] Login form appears with selected role
- [ ] Backend receives login POST request
- [ ] Tokens saved to localStorage
- [ ] Redirected to dashboard
- [ ] Dashboard layout with sidebar displays
- [ ] Sidebar navigation links work
- [ ] Role-specific pages load correctly
- [ ] Logout clears tokens and redirects to roles

---

## 🔍 Common File Checks

### Backend Structure
```
backend/
├── src/
│   ├── app.ts                    ✓ CORS enabled
│   ├── index.ts                  ✓ Server startup
│   ├── routes/
│   │   ├── v1/index.ts          ✓ Route aggregator
│   │   ├── auth.routes.ts       ✓ Login/Register
│   │   └── protected.routes.ts  ✓ Dashboard routes
│   ├── controllers/
│   │   └── auth.controller.ts   ✓ Response format
│   └── middlewares/
│       └── auth.middleware.ts   ✓ JWT validation
├── .env                          ✓ Environment vars
└── package.json                  ✓ Dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx             ✓ Disclaimer
│   │   ├── roles/page.tsx       ✓ Role selection
│   │   ├── login/page.tsx       ✓ Login form
│   │   └── (dashboard)/
│   │       ├── layout.tsx       ✓ FIXED! Auth guard
│   │       ├── dashboard/page.tsx
│   │       ├── doctor/page.tsx
│   │       ├── user/page.tsx
│   │       ├── guardian/page.tsx
│   │       └── pharmacy/page.tsx
│   └── lib/
│       └── api.ts               ✓ API client
├── .env.local                    ✓ API URL
└── package.json                  ✓ Dependencies
```

---

## 🧪 Manual API Testing

### Test Login

```bash
# 1. Register new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "USER"
  }'

# Expected response (201 Created):
{
  "success": true,
  "data": {
    "id": "...",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "USER"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}

# 2. Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# 3. Get Profile (with token)
TOKEN="eyJ..." # Copy accessToken from login response
curl -X GET http://localhost:5000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚨 If Still Having Issues

### 1. Check All Ports Are Free
```bash
# Check what's listening on ports
netstat -tlnp | grep -E "3000|5000|5432|6379"

# If ports in use, kill or change ports:
# Edit backend .env PORT=5001
# Edit frontend .env NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

### 2. Clear Everything & Restart
```bash
# Backend
cd backend
rm -rf node_modules dist
npm install
npm run build
npm run dev

# Frontend (new terminal)
cd frontend
rm -rf node_modules .next
npm install
npm run dev

# Clear browser cache
# DevTools > Application > Clear All
```

### 3. Check Logs for Errors
```bash
# Backend logs should show:
# [DefendZero] Server running on port 5000
# (without errors)

# Frontend logs should show:
# ▲ Next.js ready in Xms
# (without errors)
```

### 4. Final Verification
```bash
# In browser console:
console.log(localStorage.getItem('defendzero_token')) // Should have token
console.log(localStorage.getItem('defendzero_role')) // Should be: DOCTOR, USER, etc
```

---

## ✅ Everything Working?

Once all tests pass:

1. Frontend loads at `http://localhost:3000` ✓
2. Disclaimer page shows ✓
3. Role selection page shows ✓
4. Can login with test credentials ✓
5. Tokens saved and redirect works ✓
6. Dashboard loads with sidebar ✓
7. Can navigate to role-specific pages ✓
8. No console errors ✓

**Congratulations! DefendZero is now running smoothly.**

---

## 📝 Notes

- All fixes have been applied to the codebase
- Dashboard layout now properly handles authentication
- Frontend and backend are properly integrated
- CORS is enabled on backend
- Error handling is comprehensive
- Routes follow professional structure

For additional help, check:
- `ROUTING_GUIDE.md` - Complete API routes reference
- `MIDDLEWARE_ARCHITECTURE.md` - Middleware patterns documentation
- `ROUTING_FIXES_SUMMARY.md` - All changes made to fix routing
