import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { auditLog } from './audit.service.js';

const getDashboard = async (teacherId) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { subject: true, class: true, section: true }
  });

  if (!teacher) {
    throw new AppError('Teacher not found', 404, 'NOT_FOUND');
  }

  const where = {};
  if (teacher.classId) where.classId = teacher.classId;
  if (teacher.sectionId) where.sectionId = teacher.sectionId;

  const [
    totalStudents,
    recentMarks,
    todayAttendance,
    totalSubjects
  ] = await Promise.all([
    prisma.student.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.mark.count({ where: { createdBy: teacherId } }),
    prisma.attendance.count({
      where: {
        teacherId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    }),
    prisma.subject.count()
  ]);

  return {
    teacher,
    stats: { totalStudents, recentMarks, todayAttendance, totalSubjects }
  };
};

const getAssignedStudents = async (teacherId, filters) => {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) {
    throw new AppError('Teacher not found', 404, 'NOT_FOUND');
  }

  const where = { status: 'ACTIVE' };
  if (teacher.classId) where.classId = teacher.classId;
  if (teacher.sectionId) where.sectionId = teacher.sectionId;
  if (filters.classId) where.classId = filters.classId;
  if (filters.sectionId) where.sectionId = filters.sectionId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { studentId: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return prisma.student.findMany({
    where,
    include: {
      class: true,
      section: true,
      parents: true,
      _count: { select: { attendance: true, marks: true } }
    },
    orderBy: { rollNumber: 'asc' }
  });
};

const getAssignedSubjects = async (teacherId) => {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { subject: true }
  });

  if (!teacher?.subject) {
    return prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  return [teacher.subject];
};

const createMark = async (data) => {
  if (data.marks < 0 || data.marks > data.maxMarks) {
    throw new AppError('Invalid marks', 400, 'INVALID_MARKS');
  }

  const existing = await prisma.mark.findUnique({
    where: {
      studentId_subjectId_examType_testName: {
        studentId: data.studentId,
        subjectId: data.subjectId,
        examType: data.examType,
        testName: data.testName
      }
    }
  });

  if (existing) {
    throw new AppError('Mark already exists', 409, 'DUPLICATE');
  }

  const mark = await prisma.mark.create({
    data: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      examType: data.examType,
      testName: data.testName,
      marks: data.marks,
      maxMarks: data.maxMarks,
      remarks: data.remarks,
      createdBy: data.createdBy
    },
    include: {
      student: { select: { name: true, rollNumber: true } },
      subject: true
    }
  });

  await auditLog('TEACHER_CREATE_MARK', 'Mark', mark.id, null, data.createdBy);

  return mark;
};

const getMyMarks = async (teacherId, filters) => {
  const where = { createdBy: teacherId };
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.subjectId) where.subjectId = filters.subjectId;

  return prisma.mark.findMany({
    where,
    include: {
      student: { select: { name: true, studentId: true, rollNumber: true } },
      subject: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

const markAttendance = async (data) => {
  const targetDate = new Date(data.date);
  const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
  const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));

  const existing = await prisma.attendance.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      classId: data.classId,
      sectionId: data.sectionId,
      ...(data.subjectId && { subjectId: data.subjectId })
    }
  });

  const existingMap = new Map(
    existing.map(a => [`${a.studentId}-${a.subjectId || 'null'}`, a])
  );

  const results = [];
  for (const record of data.records) {
    const key = `${record.studentId}-${data.subjectId || 'null'}`;
    try {
      if (existingMap.has(key)) {
        const updated = await prisma.attendance.update({
          where: { id: existingMap.get(key).id },
          data: {
            status: record.status,
            remarks: record.remarks,
            teacherId: data.teacherId
          }
        });
        results.push({ ...updated, action: 'updated' });
      } else {
        const created = await prisma.attendance.create({
          data: {
            studentId: record.studentId,
            teacherId: data.teacherId,
            subjectId: data.subjectId || null,
            classId: data.classId,
            sectionId: data.sectionId,
            date: dayStart,
            status: record.status,
            remarks: record.remarks
          }
        });
        results.push({ ...created, action: 'created' });
      }
    } catch (err) {
      results.push({ error: err.message, studentId: record.studentId });
    }
  }

  return { results, totalProcessed: data.records.length };
};

const getMyAttendanceRecords = async (teacherId, filters) => {
  const where = { teacherId };
  if (filters.date) {
    const d = new Date(filters.date);
    where.date = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lt: new Date(d.setHours(23, 59, 59, 999))
    };
  }
  if (filters.classId) where.classId = filters.classId;
  if (filters.sectionId) where.sectionId = filters.sectionId;

  return prisma.attendance.findMany({
    where,
    include: {
      student: { select: { name: true, rollNumber: true } },
      subject: true,
      class: true,
      section: true
    },
    orderBy: { date: 'desc' },
    take: 100
  });
};

export const teacherService = {
  getDashboard,
  getAssignedStudents,
  getAssignedSubjects,
  createMark,
  getMyMarks,
  markAttendance,
  getMyAttendanceRecords
};
