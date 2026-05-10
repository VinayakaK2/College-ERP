import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { auditLog } from './audit.service.js';

const getAttendance = async (filters, { page, limit, skip }) => {
  const where = {};
  if (filters.classId) where.classId = filters.classId;
  if (filters.sectionId) where.sectionId = filters.sectionId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.date) {
    const d = new Date(filters.date);
    where.date = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lt: new Date(d.setHours(23, 59, 59, 999))
    };
  }
  if (filters.startDate && filters.endDate) {
    where.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    };
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { name: true, studentId: true, rollNumber: true } },
        subject: { select: { name: true } },
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
        section: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    }),
    prisma.attendance.count({ where })
  ]);

  return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getAttendanceSummary = async ({ classId, sectionId, subjectId, month, year }) => {
  const where = {};
  if (classId) where.classId = classId;
  if (sectionId) where.sectionId = sectionId;
  if (subjectId) where.subjectId = subjectId;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  const records = await prisma.attendance.findMany({ where });

  const total = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const late = records.filter(r => r.status === 'LATE').length;
  const medical = records.filter(r => r.status === 'MEDICAL_LEAVE').length;

  const byDate = {};
  records.forEach(r => {
    const dateKey = r.date.toISOString().split('T')[0];
    if (!byDate[dateKey]) {
      byDate[dateKey] = { total: 0, present: 0 };
    }
    byDate[dateKey].total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') byDate[dateKey].present++;
  });

  return {
    totalRecords: total,
    present,
    absent,
    late,
    medical,
    percentage: total > 0 ? (((present + late) / total) * 100).toFixed(2) : 0,
    dailyBreakdown: Object.entries(byDate).map(([date, data]) => ({
      date,
      ...data,
      percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(2) : 0
    })).sort((a, b) => a.date.localeCompare(b.date))
  };
};

const markAttendance = async ({ records, subjectId, classId, sectionId, date, teacherId }) => {
  const targetDate = new Date(date);
  const now = new Date();
  if (targetDate > now) {
    throw new AppError('Cannot mark attendance for future dates', 400, 'FUTURE_DATE');
  }

  const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
  const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

  const existing = await prisma.attendance.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      classId,
      sectionId,
      ...(subjectId && { subjectId })
    }
  });

  const existingMap = new Map(
    existing.map(a => [`${a.studentId}-${a.subjectId || 'null'}`, a])
  );

  const results = [];
  const errors = [];

  for (const record of records) {
    const key = `${record.studentId}-${subjectId || 'null'}`;
    try {
      if (existingMap.has(key)) {
        const updated = await prisma.attendance.update({
          where: { id: existingMap.get(key).id },
          data: {
            status: record.status,
            remarks: record.remarks,
            teacherId
          },
          include: {
            student: { select: { name: true, rollNumber: true } },
            subject: true
          }
        });
        results.push({ ...updated, action: 'updated' });
      } else {
        const created = await prisma.attendance.create({
          data: {
            studentId: record.studentId,
            teacherId,
            subjectId: subjectId || null,
            classId,
            sectionId,
            date: dayStart,
            status: record.status,
            remarks: record.remarks
          },
          include: {
            student: { select: { name: true, rollNumber: true } },
            subject: true
          }
        });
        results.push({ ...created, action: 'created' });
      }
    } catch (err) {
      errors.push({ studentId: record.studentId, error: err.message });
    }
  }

  await auditLog('MARK_ATTENDANCE', 'Attendance', null, null, teacherId);

  return { results, errors, totalProcessed: records.length };
};

const updateAttendance = async (id, data) => {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) {
    throw new AppError('Attendance record not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      status: data.status,
      remarks: data.remarks
    },
    include: {
      student: { select: { name: true, rollNumber: true } },
      subject: true
    }
  });

  return updated;
};

const getStudentAttendance = async (studentId, { month, year, subjectId }) => {
  const where = { studentId };
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }
  if (subjectId) where.subjectId = subjectId;

  const records = await prisma.attendance.findMany({
    where,
    include: { subject: true },
    orderBy: { date: 'desc' }
  });

  const total = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

  return { records, total, present, percentage };
};

export const attendanceService = {
  getAttendance,
  getAttendanceSummary,
  markAttendance,
  updateAttendance,
  getStudentAttendance
};
