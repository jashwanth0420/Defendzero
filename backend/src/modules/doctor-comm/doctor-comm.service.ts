import { prisma } from '../../config/prisma';

export class DoctorCommService {
  public async sendMessage(senderId: string, receiverId: string, content: string, type: 'NOTE' | 'ALERT' | 'REMINDER' = 'NOTE') {
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });

    if (!sender || !receiver) {
      throw new Error('Sender or Receiver not found');
    }

    // Role checks: Patient -> Doctor or Doctor -> Patient
    if (!(
      (sender.role === 'USER' && receiver.role === 'DOCTOR') ||
      (sender.role === 'DOCTOR' && receiver.role === 'USER')
    )) {
      throw new Error('Unauthorized communication path');
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.doctorMessage.create({
        data: { senderId, receiverId, content, type }
      });

      await tx.notification.create({
        data: {
          userId: receiverId,
          type: 'DOCTOR_MESSAGE',
          title: `Doctor ${type.toLowerCase()}`,
          body: content,
        }
      });

      return created;
    });

    return message;
  }

  public async getMessages(userId: string) {
    const messages = await prisma.doctorMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { firstName: true, lastName: true, role: true } },
        receiver: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    if (!messages.length) {
      throw new Error('No messages found in database.');
    }

    return messages;
  }
}
