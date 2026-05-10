import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { auditLog } from './audit.service.js';

const getAnnouncements = async (filters, { page, limit, skip }) => {
  const where = {
    OR: [
      { expiryDate: null },
      { expiryDate: { gt: new Date() } }
    ]
  };

  if (filters.audience) where.audience = filters.audience;
  if (filters.priority) where.priority = filters.priority;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { name: true } }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    }),
    prisma.announcement.count({ where })
  ]);

  return { announcements, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createAnnouncement = async (data) => {
  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      description: data.description,
      audience: data.audience,
      priority: data.priority || 'NORMAL',
      attachmentUrl: data.attachmentUrl,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      createdBy: data.createdBy
    },
    include: {
      user: { select: { name: true } }
    }
  });

  await auditLog('CREATE_ANNOUNCEMENT', 'Announcement', announcement.id, null, data.createdBy);

  return announcement;
};

const getAnnouncement = async (id) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  return announcement;
};

const deleteAnnouncement = async (id) => {
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    throw new AppError('Announcement not found', 404, 'NOT_FOUND');
  }

  await prisma.announcement.delete({ where: { id } });

  return true;
};

export const announcementService = {
  getAnnouncements,
  createAnnouncement,
  getAnnouncement,
  deleteAnnouncement
};
