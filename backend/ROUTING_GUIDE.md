# DefendZero API Routing Guide

## Base URL
`http://localhost:5000/api/v1`

---

## PUBLIC ROUTES (No Authentication Required)

### Authentication Module
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth login
- `PATCH /auth/upgrade-role` - Upgrade user role (requires JWT)

---

## PROTECTED ROUTES (Authentication Required)

### Profile & Dashboard
- `GET /profile` - Get authenticated user profile
- `GET /doctor/dashboard` - Get doctor dashboard (requires DOCTOR role)
- `GET /pharmacy/orders` - Get pharmacy orders (requires PHARMACY role)

---

## USER (PATIENT) ROUTES
**Base Path:** `/user`
**Authentication:** Required (JWT)
**Authorization:** Requires USER role

### Safety Engine
- `POST /user/safety/check` - Check medicine interactions and safety
  - Body: `{ targetMedicineId, currentMedicineIds }`

### Medicines Search
- `GET /user/medicines/search?q={query}&limit={limit}` - Search medicines (fuzzy search)

### Adherence Tracking
- `POST /user/adherence/schedules` - Create adherence schedule
- `GET /user/adherence/schedules` - Get all adherence schedules
- `POST /user/adherence/schedules/{scheduleId}/logs` - Log medicine adherence
  - Body: `{ status: 'TAKEN' | 'MISSED' | 'SKIPPED' }`

### Messages
- `POST /user/messages/messages` - Send message to doctor
- `GET /user/messages/messages` - Get all messages

### Patient Guardians
- `GET /user/guardians` - Get guardians for current patient

---

## GUARDIAN ROUTES
**Base Path:** `/guardian`
**Authentication:** Required (JWT)
**Authorization:** Requires GUARDIAN role

- `POST /guardian/add-patient` - Add a patient to guardian's list
  - Body: `{ patientId }`
- `GET /guardian/patients` - Get all patients under guardian

---

## PHARMACY ROUTES
**Base Path:** `/pharmacy`
**Authentication:** Required (JWT)
**Authorization:** Requires PHARMACY role

- `GET /pharmacy` - Get all pharmacies
- `POST /pharmacy/process-purchase` - Process medicine purchase with token
  - Body: `{ token, requestedQuantity }`

---

## DOCTOR ROUTES
**Base Path:** `/doctor`
**Authentication:** Required (JWT)
**Authorization:** Requires DOCTOR role

### Patient Management
- `POST /doctor/patients` - Add new patient
  - Body: `{ email, firstName, lastName, phone?, isPregnant?, trimester? }`
- `GET /doctor/patients` - Get all patients under doctor

### Prescriptions
- `POST /doctor/prescriptions` - Create prescription for patient
  - Body: `{ patientId, medicines: [{ medicineId, dosage, frequency, timeOfDay }] }`

### Pharmacy Tokens
- `POST /doctor/pharmacy-tokens/generate` - Generate purchase token for patient
  - Body: `{ patientId, medicineId, maxQuantity }`

---

## Health Check
- `GET /health` - Service health status
  - Response: `{ success: true, status: string, timestamp: ISO8601 }`

---

## Error Responses

### 400 Bad Request
- Validation errors from Zod
- Malformed request body

### 401 Unauthorized
- Missing or invalid JWT token
- User no longer exists

### 403 Forbidden
- Invalid or expired token
- User lacks required role

### 404 Not Found
- Endpoint or resource not found

### 500 Internal Server Error
- Unexpected server error

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

---

## Authentication Header
All requests to protected routes must include:
```
Authorization: Bearer <JWT_TOKEN>
```

## Token Storage (Frontend)
Tokens are stored in localStorage with key: `defendzero_token`
