# 🚀 FORCE START - WORKING IN 2 MINUTES

## STEP 1: Kill Any Running Servers

**Windows:**
```powershell
# Kill all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Or in Task Manager: Find node.exe and End Task (all instances)
```

**Mac/Linux:**
```bash
killall node 2>/dev/null
```

---

## STEP 2: Clean Backend

```bash
cd backend

# Remove all build artifacts
rm -r dist node_modules
del package-lock.json 2>nul

# Reinstall from scratch
npm install

# Build TypeScript
npm run build

# Do NOT run db migrations - skip for now
```

Expected output:
```
npm install (installs packages)
npm run build (creates dist folder)
```

---

## STEP 3: Start Backend (Terminal 1)

```bash
# From backend folder
npm start

# OR if that fails:
node dist/index.js

# Expected output:
# [DefendZero] Server running on port 5000
```

**VERIFY:** Open new terminal and test:
```bash
curl http://localhost:5000/health
# Should return: {"success": true, "status": "...", "timestamp": "..."}
```

---

## STEP 4: Clean Frontend

```bash
cd frontend

# Remove cache and dependencies
rm -r .next node_modules
del package-lock.json 2>nul

# Reinstall 
npm install
```

Expected output:
```
npm install (installs all packages)
```

---

## STEP 5: Start Frontend (Terminal 2)

```bash
# From frontend folder
npm run dev

# Expected output:
# ▲ Next.js will start server
```

**WAIT** for it to say:
```
> Local: http://localhost:3000
```

---

## STEP 6: Test in Browser

1. Open: `http://localhost:3000`
2. You should see medicine disclaimer page
3. Click "I Understand & Agree"
4. Select a role
5. **Login should work NOW**
6. **Dashboard should load WITHOUT 404**

---

## If Still 404:

### Check 1: Is Dashboard Layout File There?
```powershell
Test-Path "frontend\src\app\(dashboard\)\layout.tsx"
# Should return: True
```

### Check 2: Clear Next.js Cache
```bash
cd frontend
rm -r .next
rm -r .turbo
npm run dev
```

### Check 3: Check Node Version
```bash
node --version
# Should be v18 or higher
```

### Check 4: Check Ports
```bash
# Frontend should be on 3000
# Backend should be on 5000
# If already in use, close what's using them
```

### Check 5: Frontend .env.local
```bash
# Should contain:
cat frontend/.env.local

# Expected:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## Nuclear Option: Fresh Everything

If STILL not working:

```bash
# 1. Close all terminals
# 2. Kill all node processes  
# 3. Delete all node_modules

cd /
rm -r backend/node_modules frontend/node_modules 2>nul

# 4. Reinstall backend
cd backend
npm install
npm run build

# 5. Reinstall frontend
cd ../frontend
npm install

# 6. Start backend
cd ../backend
npm start

# 7. Start frontend (new terminal)
cd ../frontend
npm run dev

# 8. Wait 30 seconds for Next.js to compile
# 9. Open http://localhost:3000
```

---

## Files That Should Exist

```
✓ frontend/src/app/(dashboard)/layout.tsx       ← CRITICAL
✓ frontend/src/app/(dashboard)/dashboard/page.tsx
✓ frontend/src/app/(dashboard)/user/page.tsx
✓ frontend/src/app/(dashboard)/doctor/page.tsx  
✓ frontend/src/app/(dashboard)/guardian/page.tsx
✓ frontend/src/app/(dashboard)/pharmacy/page.tsx
✓ backend/.env
✓ frontend/.env.local
```

---

## Success Indicators

- ✅ Terminal 1: Backend shows `[DefendZero] Server running on port 5000`
- ✅ Terminal 2: Frontend shows `▲ Next.js ready...` after ~30 seconds
- ✅ Browser: Can see medical disclaimer
- ✅ Click button: Redirects to role selection
- ✅ Select role: Goes to login
- ✅ Submit login: Redirects to dashboard (NOT 404)
- ✅ Dashboard visible: See sidebar with options
- ✅ Console: No red errors

---

## Quick Debug Commands

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check if frontend is running
curl http://localhost:3000

# Check ports in use (Windows)
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Check ports in use (Mac/Linux)
lsof -i :3000
lsof -i :5000
```

---

## That's It!

Follow these steps IN ORDER and you'll have the app running in under 5 minutes.

**The key is:** Clean build, fresh node_modules, sequential startup.
