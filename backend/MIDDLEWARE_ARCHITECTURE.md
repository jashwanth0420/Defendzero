# DefendZero Middleware & Routing Architecture Guide

## Architecture Overview

DefendZero uses a **layered middleware architecture** with role-based access control at multiple levels.

```
┌─────────────────────────────────────────────────────────────┐
│                    Express Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Core Middleware                                  │
│  ├─ helmet() - Security headers                            │
│  ├─ cors() - Cross-origin requests                         │
│  └─ express.json() - JSON parsing                          │
│                                                             │
│  Layer 2: Route Handlers                                   │
│  ├─ Health Check (no auth)                                 │
│  └─ /api/v1 - Main API routes                             │
│                                                             │
│  Layer 3: Auth & Role Validation (per route group)         │
│  ├─ authenticateJWT - Validates JWT token                  │
│  └─ requireRole(s) - Validates user role                   │
│                                                             │
│  Layer 4: 404 Handler                                      │
│  └─ Returns structured 404 response                        │
│                                                             │
│  Layer 5: Error Handler                                    │
│  └─ Catches and formats all errors                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Route Organization

### 1. Public Routes (No Authentication)
Located in: `routes/auth.routes.ts`

```typescript
// These routes are accessible without JWT
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/google
```

### 2. Protected Routes (Authentication Required)
Located in: `routes/protected.routes.ts`

```typescript
// Base structure
router.use('/', protectedRoutes);

// Inside protectedRoutes:
GET /profile                    - Any authenticated user
GET /doctor/dashboard           - DOCTOR role only
GET /pharmacy/orders            - PHARMACY role only
GET /user/guardians             - USER role only
```

### 3. Feature-Specific Routes (Mounted in v1/index.ts)

Each feature module has its own route file with specific middleware:

```typescript
// User Features (require USER role)
router.use('/user/safety', authenticateJWT, requireUser, safetyRoutes);
router.use('/user/adherence', authenticateJWT, requireUser, adherenceRoutes);
router.use('/user/medicines', authenticateJWT, requireUser, medicinesRoutes);
router.use('/user/messages', authenticateJWT, requireUser, doctorCommRoutes);

// Guardian Features (require GUARDIAN role)
router.use('/guardian', authenticateJWT, requireGuardian, guardianRoutes);

// Pharmacy Features (require PHARMACY role)
router.use('/pharmacy', authenticateJWT, requirePharmacy, pharmacyRoutes);

// Doctor Features (require DOCTOR role)
router.use('/doctor', authenticateJWT, requireDoctor, doctorRoutes);
```

---

## Middleware Flow for Protected Routes

### Example: Patient checks medicine safety

```
1. HTTP Request arrives
   POST /api/v1/user/safety/check
   Headers: { Authorization: "Bearer <JWT>" }
   Body: { targetMedicineId: "...", currentMedicineIds: [...] }

2. Core Middlewares
   ✓ helmet() adds security headers
   ✓ cors() validates origin
   ✓ express.json() parses body

3. Router Matching
   ✓ Matches /api/v1/user/safety/check

4. Parent Middleware Chain (from v1/index.ts)
   → authenticateJWT middleware
      • Extracts JWT from Authorization header
      • Verifies signature with JWT_SECRET
      • Fetches user from database
      • Attaches user object to req.user
      • Calls next() if valid
      • Returns 401/403 if invalid

   → requireUser middleware
      • Checks if req.user.role === 'USER'
      • Returns 403 if role doesn't match
      • Calls next() if allowed

5. Module Route Handler (safety.routes.ts)
   → Routes request to SafetyController.checkInteraction()

6. Controller Layer
   → Validates payload with Zod
   → Calls SafetyEngineService.evaluateSafety()

7. Service Layer
   → Executes Prisma database queries
   → Implements business logic
   → Returns results or throws errors

8. Response Back
   → Controller returns JSON response

9. Error Handling (if errors occur)
   → Only the first error is caught
   → Error middleware formats response
   → Returns {success: false, error: "..."}
```

---

## Middleware Chain Explanation

### authenticateJWT
```typescript
// Location: middlewares/auth.middleware.ts

// What it does:
1. Checks for "Authorization: Bearer <token>" header
2. Extracts token from header
3. Verifies token signature using JWT_SECRET
4. Looks up user in database by userId from token
5. Attaches user object to req.user
6. Calls next() if all checks pass
7. Returns 401/403 if any check fails

// Example:
const authHeader = req.headers.authorization;
// "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

const token = authHeader.split(' ')[1];
const payload = verifyToken(token); // { userId, role }
const user = prisma.user.findUnique({ id: payload.userId });
req.user = user;
next();
```

### Role-Based Middleware
```typescript
// Location: middlewares/role.middleware.ts

// Generic role checker
export const requireRole = (roles: Role[]) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({...});
    if (!roles.includes(req.user.role)) return res.status(403).json({...});
    next();
  };
};

// Specific implementations
export const requireDoctor = requireRole([Role.DOCTOR]);
export const requirePharmacy = requireRole([Role.PHARMACY]);
export const requireGuardian = requireRole([Role.GUARDIAN]);
export const requireUser = requireRole([Role.USER]);
```

---

## Request Examples with Middleware

### ✅ Successful Request Flow

```
POST /api/v1/user/medicines/search?q=aspirin
Headers: Authorization: Bearer <valid-jwt-for-user>

Step 1: Core middlewares pass
Step 2: v1 routes match
Step 3: authenticateJWT runs ✓ (token valid, user found)
Step 4: requireUser runs ✓ (req.user.role === 'USER')
Step 5: medicinesRoutes.search() handler runs
Step 6: Response: { success: true, data: [...] }
```

### ❌ Failed: Missing Authorization

```
POST /api/v1/user/medicines/search?q=aspirin
Headers: {} (no Authorization header)

Step 1: Core middlewares pass
Step 2: v1 routes match
Step 3: authenticateJWT runs ✗ (no header)
Response: 401 "Authorization token missing or invalid format"
```

### ❌ Failed: Invalid JWT

```
POST /api/v1/user/medicines/search?q=aspirin
Headers: Authorization: Bearer invalid.token.here

Step 1: Core middlewares pass
Step 2: v1 routes match
Step 3: authenticateJWT runs ✗ (invalid signature)
Response: 403 "Invalid or expired token"
```

### ❌ Failed: Wrong Role

```
POST /api/v1/doctor/patients
Headers: Authorization: Bearer <valid-jwt-for-pharmacy>

Step 1: Core middlewares pass
Step 2: v1 routes match
Step 3: authenticateJWT runs ✓ (token valid)
Step 4: requireDoctor runs ✗ (req.user.role === 'PHARMACY', not 'DOCTOR')
Response: 403 "Forbidden. Action requires one of: DOCTOR"
```

---

## Adding New Routes

### Step 1: Create New Module
```
backend/src/modules/new-feature/
├── new-feature.routes.ts
├── new-feature.controller.ts
└── new-feature.service.ts
```

### Step 2: Define Routes (no middleware in module!)
```typescript
// new-feature.routes.ts
import { Router } from 'express';
import { NewFeatureController } from './new-feature.controller';

const router = Router();
const controller = new NewFeatureController();

// NOTE: Do NOT add middleware here!
// Middleware is applied at parent level in v1/index.ts
router.get('/', controller.getAll);
router.post('/', controller.create);

export default router;
```

### Step 3: Register in v1/index.ts
```typescript
// routes/v1/index.ts
import newFeatureRoutes from '../../modules/new-feature/new-feature.routes';

// Apply middleware and mount
router.use(
  '/new-feature',
  authenticateJWT,
  requireSpecificRole,
  newFeatureRoutes
);
```

### Step 4: Result
Users accessing the route:
```
GET /api/v1/new-feature
     → authenticateJWT runs
     → requireSpecificRole runs
     → newFeatureRoutes handler runs
```

---

## Error Handling Flow

```typescript
// In any controller
try {
  const data = await service.method();
  res.status(200).json({ success: true, data });
} catch (error) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ success: false, error: 'Validation failed' });
  } else {
    // Let Express catch unhandled errors
    throw error;
  }
}
```

Express error handler catches thrown errors:
```typescript
// In app.ts
app.use((err, req, res, next) => {
  // Middleware catches all thrown errors
  // Formats them appropriately
  // Returns structured response
});
```

---

## Best Practices for Development

### ✅ DO:
1. Only add middleware at parent level (v1/index.ts)
2. Keep modules lightweight
3. Use Zod for input validation
4. Catch Zod errors specifically
5. Let other errors bubble up to error handler
6. Use correct role checker for feature
7. Throw descriptive errors from services

### ❌ DON'T:
1. Apply same middleware multiple times
2. Add authenticateJWT in module routes (already applied)
3. Use raw try-catch for errors unless needed
4. Skip role validation on protected routes
5. Return error responses from middleware (let error handler do it)
6. Mix authorization logic in controllers
7. Modify req object outside of middleware

---

## Debugging Middleware Issues

### Check authentication flow
```bash
# 1. Enable debug logging
NODE_ENV=development npm run dev

# 2. Add console logs in auth middleware
console.log('Auth header:', req.headers.authorization);
console.log('Token payload:', payload);
console.log('User found:', user);

# 3. Check JWT_SECRET is set in .env
echo $JWT_SECRET
```

### Check role validation
```bash
# 1. Verify role in database
SELECT id, email, role FROM users WHERE id = '...';

# 2. Check role enum in Prisma schema
# Should match @prisma/client Role enum

# 3. Verify role middleware is applied correctly
# Search for requireRole in v1/index.ts
```

### Check route matching
```bash
# 1. Test endpoint with correct path
curl http://localhost:5000/api/v1/user/safety/check

# 2. Check v1/index.ts mounting order
# Routes are matched top to bottom

# 3. Verify no typos in middleware names
# authenticateJWT (not authenticate, not validateJWT)
```

---

## Performance Optimization

### Current Optimizations:
- Middleware runs only once per route group (not per individual route)
- JWT validation includes user lookup (ensures user still exists)
- Role checks are O(1) array membership tests
- Prisma queries include only necessary fields with `select`

### Future Improvements:
- Add middleware caching layer
- Implement JWT blacklist for logout
- Add rate limiting middleware
- Cache user role lookups (with TTL)

---

## Security Considerations

1. **JWT Secret Management:**
   - Never commit JWT_SECRET to git
   - Use environment variables
   - Rotate regularly in production

2. **Role-Based Access Control:**
   - Always verify role at route level
   - Don't rely on frontend role validation
   - Check isVerified for sensitive operations

3. **Error Messages:**
   - Don't expose internal database structure
   - Use generic error messages for auth/role failures
   - Log detailed errors server-side only

4. **Middleware Order:**
   - Helmet should be first (security headers)
   - Auth should be early (whitelist auth routes)
   - Error handler should be last

---

## Testing Middleware

```typescript
// Example: Test authenticateJWT
import { authenticateJWT } from '../middlewares/auth.middleware';

test('authenticateJWT rejects missing token', async () => {
  const req = { headers: {} };
  const res = { status: jest.fn().json: jest.fn() };
  
  await authenticateJWT(req, res, jest.fn());
  
  expect(res.status).toHaveBeenCalledWith(401);
});

test('authenticateJWT accepts valid token', async () => {
  const validToken = generateToken({ userId: '123', role: 'USER' });
  const req = { headers: { authorization: `Bearer ${validToken}` } };
  const next = jest.fn();
  
  await authenticateJWT(req, res, next);
  
  expect(next).toHaveBeenCalled();
  expect(req.user).toBeDefined();
});
```

---

## Summary

The middleware architecture ensures:
- ✅ Single point of authentication validation
- ✅ Consistent role-based authorization
- ✅ Clean separation of concerns
- ✅ Reusable middleware chains
- ✅ Proper error handling
- ✅ Security by default

Always apply middleware at the parent route level, never repeat in modules!
