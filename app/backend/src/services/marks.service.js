import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { auditLog } from './audit.service.js';

const getMarks = async (filters, { page, limit, skip }) => {
  const where = {};
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.examType) where.examType = filters.examType;
  if (filters.classId) {
    const students = await prisma.student.findMany({
      where: { classId: filters.classId },
      select: { id: true }
    });
    where.studentId = { in: students.map(s => s.id) };
  }

  const [marks, total] = await Promise.all([
    prisma.mark.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { name: true, studentId: true, rollNumber: true } },
        subject: true,
        teacher: { include: { user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mark.count({ where })
  ]);

  return { marks, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createMark = async (data) => {
  if (data.marks < 0 || data.marks > data.maxMarks) {
    throw new AppError(`Marks must be between 0 and ${data.maxMarks}`, 400, 'INVALID_MARKS');
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
    throw new AppError('Mark already exists for this test', 409, 'DUPLICATE');
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
      answerSheetUrl: data.answerSheetUrl,
      createdBy: data.createdBy
    },
    include: {
      student: { select: { name: true } },
      subject: true,
      teacher: { include: { user: { select: { name: true } } } }
    }
  });

  await auditLog('CREATE_MARK', 'Mark', mark.id, null, data.createdBy);

  return mark;
};

const getMark = async (id) => {
  const mark = await prisma.mark.findUnique({
    where: { id },
    include: {
      student: { select: { name: true, studentId: true } },
      subject: true,
      teacher: { include: { user: { select: { name: true } } } }
    }
  });

  if (!mark) {
    throw new AppError('Mark not found', 404, 'NOT_FOUND');
  }

  return mark;
};

const updateMark = async (id, data, userId) => {
  const mark = await prisma.mark.findUnique({ where: { id } });
  if (!mark) {
    throw new AppError('Mark not found', 404, 'NOT_FOUND');
  }

  const oldValue = { ...mark };

  if (data.marks !== undefined && (data.marks < 0 || (data.maxMarks && data.marks > data.maxMarks) || (!data.maxMarks && data.marks > mark.maxMarks))) {
    throw new AppError('Invalid marks value', 400, 'INVALID_MARKS');
  }

  const updated = await prisma.mark.update({
    where: { id },
    data: {
      marks: data.marks,
      maxMarks: data.maxMarks,
      remarks: data.remarks,
      answerSheetUrl: data.answerSheetUrl
    },
    include: {
      student: { select: { name: true } },
      subject: true,
      teacher: { include: { user: { select: { name: true } } } }
    }
  });

  await auditLog('UPDATE_MARK', 'Mark', id, oldValue, userId);

  return updated;
};

const deleteMark = async (id) => {
  const mark = await prisma.mark.findUnique({ where: { id } });
  if (!mark) {
    throw new AppError('Mark not found', 404, 'NOT_FOUND');
  }

  await prisma.mark.delete({ where: { id } });
  await auditLog('DELETE_MARK', 'Mark', id, null);

  return true;
};

const getStudentMarks = async (studentId, filters) => {
  const where = { studentId };
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.examType) where.examType = filters.examType;

  const marks = await prisma.mark.findMany({
    where,
    include: { subject: true },
    orderBy: { createdAt: 'desc' }
  });

  const subjectStats = {};
  marks.forEach(m => {
    const sid = m.subjectId;
    if (!subjectStats[sid]) {
      subjectStats[sid] = { subject: m.subject, total: 0, max: 0, count: 0, tests: [] };
    }
    subjectStats[sid].total += m.marks;
    subjectStats[sid].max += m.maxMarks;
    subjectStats[sid].count++;
    subjectStats[sid].tests.push(m);
  });

  const analysis = Object.values(subjectStats).map(s => ({
    subject: s.subject,
    average: s.max > 0 ? ((s.total / s.max) * 100).toFixed(2) : 0,
    totalTests: s.count,
    tests: s.tests
  }));

  return { marks, analysis };
};

const getClassRanking = async (classId, subjectId, examType) => {
  const students = await prisma.student.findMany({
    where: { classId, status: 'ACTIVE' },
    select: { id: true, name: true, studentId: true, rollNumber: true }
  });

  const studentIds = students.map(s => s.id);
  const marksWhere = {
    studentId: { in: studentIds },
    ...(subjectId && { subjectId }),
    ...(examType && { examType })
  };

  const marks = await prisma.mark.findMany({
    where: marksWhere,
    include: { subject: true }
  });

  const studentScores = {};
  students.forEach(s => {
    studentScores[s.id] = { ...s, totalMarks: 0, totalMax: 0, subjects: {} };
  });

  marks.forEach(m => {
    if (studentScores[m.studentId]) {
      studentScores[m.studentId].totalMarks += m.marks;
      studentScores[m.studentId].totalMax += m.maxMarks;
      const sid = m.subjectId;
      if (!studentScores[m.studentId].subjects[sid]) {
        studentScores[m.studentId].subjects[sid] = { total: 0, max: 0, subject: m.subject };
      }
      studentScores[m.studentId].subjects[sid].total += m.marks;
      studentScores[m.studentId].subjects[sid].max += m.maxMarks;
    }
  });

  const rankings = Object.values(studentScores)
    .filter(s => s.totalMax > 0)
    .map(s => ({
      ...s,
      percentage: ((s.totalMarks / s.totalMax) * 100).toFixed(2),
      subjectCount: Object.keys(s.subjects).length
    }))
    .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
    .map((s, i) => ({ ...s, rank: i + 1 }));

  return rankings;
};

export const marksService = {
  getMarks,
  createMark,
  getMark,
  updateMark,
  deleteMark,
  getStudentMarks,
  getClassRanking
};
