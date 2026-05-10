import { prisma } from '../config/database.js';

const auditLog = async (action, entity, entityId, oldValue, userId, ipAddress) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId?.toString(),
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        ipAddress
      }
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

export { auditLog };
