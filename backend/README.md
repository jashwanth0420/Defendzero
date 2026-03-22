# Medicine Safety Engine Backend

Production-ready TypeScript backend endpoint for medicine safety checks using RxNorm and RxNav interaction APIs.

## Stack

- Node.js + Express
- TypeScript
- Axios (with timeout + retry)
- Zod validation
- Jest + Supertest
- dotenv
- Modular architecture (`controllers`, `services`, `clients`, `utils`)

## Endpoint

### POST `/api/safety-check`

Request body:

```json
{
  "medicines": ["warfarin", "amoxicillin", "cetirizine"],
  "pregnancyStage": "unknown"
}
```

`pregnancyStage` supports: `first | second | third | unknown`.

Response shape:

```json
{
  "medicines": ["warfarin", "amoxicillin", "cetirizine"],
  "rxcuis": [
    { "medicine": "warfarin", "rxcui": "11289" },
    { "medicine": "amoxicillin", "rxcui": "197361" },
    { "medicine": "cetirizine", "rxcui": "20610" }
  ],
  "interactions": [],
  "risk": "LOW",
  "alerts": [],
  "meta": {
    "rxnormResolved": 3,
    "interactionChecked": true
  }
}
```

## Behavior Rules

- Never loses original medicine names.
- Always maps each medicine to `{ medicine, rxcui | null }`.
- Gracefully handles external API failures and returns partial results.
- Skips interaction calls when there are fewer than 2 valid RxCUIs.
- Risk logic:
  - `HIGH` if interactions exist
  - `MEDIUM` if no interactions but alerts exist
  - `LOW` otherwise
- Alerts include:
  - duplicate medicine names
  - unknown pregnancy stage (worst-case safety warning)
  - antibiotic misuse watchlist (`amoxicillin`, `azithromycin`, `ciprofloxacin`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Run dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm start
```

## Testing

Run all tests:

```bash
npm test
```

Run unit tests:

```bash
npm run test:unit
```

Run integration tests:

```bash
npm run test:integration
```

## curl Example

```bash
curl -X POST http://localhost:3000/api/safety-check \
  -H "Content-Type: application/json" \
  -d '{"medicines":["warfarin","amoxicillin"],"pregnancyStage":"unknown"}'
```

PowerShell equivalent:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/safety-check" -Method Post -ContentType "application/json" -Body '{"medicines":["warfarin","amoxicillin"],"pregnancyStage":"unknown"}'
```

## Project Structure

```text
src/
  clients/
    rxnav.client.ts
  modules/
    medicine-safety/
      safety.controller.ts
      safety-engine.service.ts
      interaction.service.ts
      rxnorm.service.ts
      safety.schema.ts
      safety.types.ts
  routes/
    safety-check.routes.ts
  utils/
    logger.ts
tests/
  unit/
  integration/
```

## User Medication Dashboard APIs

Authenticated base: `/api/v1/user/medication`

- `POST /schedules`
  Creates a medication schedule with medicine name, composition, dosage, timing, and schedule times.
- `GET /schedules`
  Lists user schedules.
- `POST /log`
  Logs `TAKEN` or `MISSED` for a schedule.
- `GET /logs?date=YYYY-MM-DD`
  Fetches logs for a date.
- `GET /history`
  Returns adherence percentage and missed streak analytics.
- `POST /prescriptions/upload`
  Stores uploaded/extracted prescription data.
- `POST /prescriptions/:prescriptionId/confirm`
  Confirms parsed medicines and marks prescription verified.
- `POST /purchase/token`
  Generates purchase token for a verified prescription.
- `POST /purchase/validate`
  Validates token, enforces quantity limits/expiry, and records purchase.
- `GET /purchases`
  Lists purchase history.
- `GET /notifications`
  Lists user notifications.
- `PATCH /notifications/:notificationId/read`
  Marks one notification as read.
