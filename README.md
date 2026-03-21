# DefendZero

DefendZero is a production-grade healthcare-safe application built with Node.js, Express, TypeScript, PostgreSQL, Redis/BullMQ, Firebase Cloud Messaging, and Next.js.

## Core Rules

* This is NOT a medical system
* Do NOT generate diagnosis, prescription, or dosage logic
* All safety logic must be deterministic and rule-based
* ML can ONLY be used for input preprocessing (typo correction, mapping)

## Architecture

* Backend: Node.js + Express + TypeScript
* Database: PostgreSQL
* Cache/Queue: Redis + BullMQ
* Notifications: Firebase Cloud Messaging
* Frontend: Next.js + React

## Modules

1. **Safety Engine**: OTC + Pregnancy compatibility checks
2. **Adherence System**: Reminders + logs
3. **Guardian System**: Patient monitoring
4. **Doctor Communication**: Non-prescriptive messaging
5. **Pharmacy Compliance System**: Token-based purchase control
