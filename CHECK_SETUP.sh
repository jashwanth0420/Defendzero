#!/bin/bash

echo "🔍 Checking DefendZero Setup..."

# Check backend .env
echo ""
echo "✓ Backend .env exists: $([ -f backend/.env ] && echo 'YES' || echo 'NO')"

# Check frontend .env
echo "✓ Frontend .env.local exists: $([ -f frontend/.env.local ] && echo 'YES' || echo 'NO')"

# Check dashboard layout
echo "✓ Dashboard layout exists: $([ -f 'frontend/src/app/(dashboard)/layout.tsx' ] && echo 'YES' || echo 'NO')"

# Check all dashboard pages
echo "✓ Dashboard pages:"
echo "  - dashboard: $([ -f 'frontend/src/app/(dashboard)/dashboard/page.tsx' ] && echo 'YES' || echo 'NO')"
echo "  - user: $([ -f 'frontend/src/app/(dashboard)/user/page.tsx' ] && echo 'YES' || echo 'NO')"
echo "  - doctor: $([ -f 'frontend/src/app/(dashboard)/doctor/page.tsx' ] && echo 'YES' || echo 'NO')"
echo "  - guardian: $([ -f 'frontend/src/app/(dashboard)/guardian/page.tsx' ] && echo 'YES' || echo 'NO')"
echo "  - pharmacy: $([ -f 'frontend/src/app/(dashboard)/pharmacy/page.tsx' ] && echo 'YES' || echo 'NO')"

echo ""
echo "📝 Backend modules:"
ls -1 backend/src/modules/ | sed 's/^/  /'

echo ""
echo "🚀 To start servers:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Then visit: http://localhost:3000"
