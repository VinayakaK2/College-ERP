import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { auditLog } from './audit.service.js';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';

const getStudents = async (filters, { page, limit, skip }) => {
  const where = { status: { not: 'DELETED' } };

  if (filters.classId) where.classId = filters.classId;
  if (filters.sectionId) where.sectionId = filters.sectionId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { studentId: { contains: filters.search, mode: 'insensitive' } },
      { rollNumber: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        class: true,
        section: true,
        parents: true,
        _count: {
          select: { attendance: true, marks: true, fees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.student.count({ where })
  ]);

  return { students, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const getStudent = async (id) => {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: true,
      section: true,
      parents: true,
      attendance: {
        orderBy: { date: 'desc' },
        take: 30,
        include: { subject: true }
      },
      marks: {
        orderBy: { createdAt: 'desc' },
        include: { subject: true },
        take: 50
      },
      fees: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { transactions: true }
      }
    }
  });

  if (!student || student.status === 'DELETED') {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  return student;
};

const createStudent = async (data) => {
  const existing = await prisma.student.findFirst({
    where: {
      OR: [
        { studentId: data.studentId },
        { AND: [
          { rollNumber: data.rollNumber },
          { classId: data.classId },
          { sectionId: data.sectionId }
        ]}
      ]
    }
  });

  if (existing) {
    throw new AppError('Student ID or Roll number already exists', 409, 'DUPLICATE');
  }

  const parentsData = data.parents?.map(p => ({
    name: p.name,
    relation: p.relation,
    phone: p.phone,
    email: p.email || null,
    isPrimary: p.isPrimary ?? true,
    password: p.phone ? bcrypt.hashSync(p.phone.slice(-6), config.bcryptRounds) : null
  })) || [];

  const student = await prisma.student.create({
    data: {
      studentId: data.studentId,
      rollNumber: data.rollNumber,
      name: data.name,
      classId: data.classId,
      sectionId: data.sectionId,
      fatherName: data.fatherName,
      motherName: data.motherName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      admissionYear: data.admissionYear,
      dob: data.dob ? new Date(data.dob) : null,
      status: 'ACTIVE',
      parents: parentsData.length > 0 ? { create: parentsData } : undefined
    },
    include: {
      class: true,
      section: true,
      parents: true
    }
  });

  return student;
};

const updateStudent = async (id, data) => {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student || student.status === 'DELETED') {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  const oldData = { ...student };

  const updated = await prisma.student.update({
    where: { id },
    data: {
      name: data.name,
      rollNumber: data.rollNumber,
      classId: data.classId,
      sectionId: data.sectionId,
      fatherName: data.fatherName,
      motherName: data.motherName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      status: data.status,
      dob: data.dob ? new Date(data.dob) : undefined
    },
    include: {
      class: true,
      section: true,
      parents: true
    }
  });

  await auditLog('UPDATE_STUDENT', 'Student', id, oldData);

  return updated;
};

const deleteStudent = async (id) => {
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  await prisma.student.update({
    where: { id },
    data: { status: 'DELETED' }
  });

  await auditLog('DELETE_STUDENT', 'Student', id, null);

  return true;
};

const getStudentPerformance = async (studentId) => {
  const marks = await prisma.mark.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { createdAt: 'desc' }
  });

  const subjectPerformance = {};
  marks.forEach(m => {
    const subId = m.subjectId;
    if (!subjectPerformance[subId]) {
      subjectPerformance[subId] = {
        subject: m.subject,
        totalMarks: 0,
        totalMax: 0,
        tests: []
      };
    }
    subjectPerformance[subId].totalMarks += m.marks;
    subjectPerformance[subId].totalMax += m.maxMarks;
    subjectPerformance[subId].tests.push(m);
  });

  const analysis = Object.values(subjectPerformance).map(sp => ({
    ...sp,
    average: sp.totalMax > 0 ? ((sp.totalMarks / sp.totalMax) * 100).toFixed(2) : 0,
    tests: sp.tests.slice(0, 10)
  }));

  const theoryMarks = marks.filter(m => m.examType === 'THEORY');
  const compMarks = marks.filter(m => m.examType === 'COMPETITIVE');

  const theoryAvg = theoryMarks.length > 0
    ? (theoryMarks.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / theoryMarks.length).toFixed(2)
    : 0;

  const compAvg = compMarks.length > 0
    ? (compMarks.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / compMarks.length).toFixed(2)
    : 0;

  return {
    overall: { theoryAvg, compAvg, totalTests: marks.length },
    subjectWise: analysis,
    recentMarks: marks.slice(0, 20)
  };
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
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const late = records.filter(r => r.status === 'LATE').length;
  const medical = records.filter(r => r.status === 'MEDICAL_LEAVE').length;
  const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0;

  return {
    records,
    summary: { total, present, absent, late, medical, percentage }
  };
};

export const studentService = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPerformance,
  getStudentAttendance
};
