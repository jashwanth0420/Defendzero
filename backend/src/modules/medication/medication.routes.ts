import { Router } from 'express';
import { MedicationController } from './medication.controller';

const router = Router();
const controller = new MedicationController();

router.post('/schedules', controller.createSchedule.bind(controller));
router.get('/schedules', controller.getSchedules.bind(controller));
router.post('/log', controller.logDose.bind(controller));
router.get('/logs', controller.getLogs.bind(controller));
router.get('/history', controller.getHistory.bind(controller));

router.post('/prescriptions/upload', controller.uploadPrescription.bind(controller));
router.post('/prescriptions/:prescriptionId/confirm', controller.confirmPrescription.bind(controller));

router.post('/purchase/token', controller.generatePurchaseToken.bind(controller));
router.post('/purchase/validate', controller.validatePurchase.bind(controller));
router.get('/purchases', controller.getPurchases.bind(controller));

router.get('/notifications', controller.getNotifications.bind(controller));
router.patch('/notifications/:notificationId/read', controller.markNotificationRead.bind(controller));

export default router;
