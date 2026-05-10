import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { config } from '../config/index.js';
import { auditLog } from './audit.service.js';

const getDashboardStats = async () => {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalParents,
    todayAttendance,
    pendingFees,
    recentAnnouncements
  ] = await Promise.all([
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.parent.count(),
    prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
    prisma.fee.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } } }
    })
  ]);

  return {
    counts: { totalStudents, totalTeachers, totalClasses, totalParents },
    todayAttendance,
    pendingFees,
    recentAnnouncements
  };
};

const getTeachers = async ({ page, limit, skip }) => {
  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true, phone: true, isActive: true } },
        subject: true,
        class: true,
        section: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.teacher.count()
  ]);

  return { teachers, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createTeacher = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');
  }

  const existingEmp = await prisma.teacher.findUnique({
    where: { employeeId: data.employeeId }
  });
  if (existingEmp) {
    throw new AppError('Employee ID already exists', 409, 'DUPLICATE_EMPLOYEE_ID');
  }

  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: 'TEACHER',
      teacher: {
        create: {
          employeeId: data.employeeId,
          subjectId: data.subjectId || null,
          classId: data.classId || null,
          sectionId: data.sectionId || null,
          qualification: data.qualification
        }
      }
    },
    include: { teacher: { include: { subject: true, class: true, section: true } } }
  });

  await auditLog('CREATE_TEACHER', 'Teacher', user.teacher.id, null, user.id);

  return user;
};

const updateTeacher = async (id, data) => {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    throw new AppError('Teacher not found', 404, 'NOT_FOUND');
  }

  const updateData = {};
  if (data.name || data.phone) {
    await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        name: data.name,
        phone: data.phone
      }
    });
  }

  const teacherUpdate = await prisma.teacher.update({
    where: { id },
    data: {
      subjectId: data.subjectId,
      classId: data.classId,
      sectionId: data.sectionId,
      qualification: data.qualification
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      subject: true,
      class: true,
      section: true
    }
  });

  return teacherUpdate;
};

const deleteTeacher = async (id) => {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    throw new AppError('Teacher not found', 404, 'NOT_FOUND');
  }

  await prisma.user.update({
    where: { id: teacher.userId },
    data: { isActive: false }
  });

  await auditLog('DELETE_TEACHER', 'Teacher', id, null, teacher.userId);

  return true;
};

const getSubjects = async () => {
  return prisma.subject.findMany({
    include: {
      _count: { select: { teachers: true } }
    },
    orderBy: { name: 'asc' }
  });
};

const createSubject = async (data) => {
  const existing = await prisma.subject.findFirst({
    where: { OR: [{ name: data.name }, { code: data.code }] }
  });
  if (existing) {
    throw new AppError('Subject name or code already exists', 409, 'DUPLICATE');
  }

  return prisma.subject.create({ data });
};

const getAuditLogs = async ({ page, limit, skip }) => {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.auditLog.count()
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const adminService = {
  getDashboardStats,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getSubjects,
  createSubject,
  getAuditLogs
};
