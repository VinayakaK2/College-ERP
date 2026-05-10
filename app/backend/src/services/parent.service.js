import { prisma } from '../config/database.js';

const getDashboard = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      section: true,
      parents: true
    }
  });

  if (!student) return null;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    attendanceCount,
    marksCount,
    feesData,
    recentAnnouncements
  ] = await Promise.all([
    prisma.attendance.count({ where: { studentId } }),
    prisma.mark.count({ where: { studentId } }),
    prisma.fee.aggregate({
      where: { studentId },
      _sum: { totalAmount: true, paidAmount: true, remainingAmount: true }
    }),
    prisma.announcement.findMany({
      where: {
        OR: [
          { audience: 'ALL' },
          { audience: 'STUDENTS' },
          { audience: 'PARENTS' }
        ],
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  const presentCount = await prisma.attendance.count({
    where: { studentId, status: 'PRESENT' }
  });

  const attendancePercentage = attendanceCount > 0
    ? ((presentCount / attendanceCount) * 100).toFixed(2)
    : 0;

  return {
    student,
    stats: {
      attendancePercentage,
      totalAttendance: attendanceCount,
      totalMarks: marksCount,
      totalFees: feesData._sum.totalAmount || 0,
      paidFees: feesData._sum.paidAmount || 0,
      pendingFees: feesData._sum.remainingAmount || 0
    },
    announcements: recentAnnouncements
  };
};

const getChildAttendance = async (studentId, { month, year, subjectId }) => {
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
  const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(2) : 0;

  const subjectWise = {};
  records.forEach(r => {
    const sid = r.subjectId || 'overall';
    const sname = r.subject?.name || 'General';
    if (!subjectWise[sid]) {
      subjectWise[sid] = { subjectName: sname, total: 0, present: 0, absent: 0 };
    }
    subjectWise[sid].total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') subjectWise[sid].present++;
    else subjectWise[sid].absent++;
  });

  return {
    records,
    summary: { total, present, absent, late, percentage },
    subjectWise: Object.values(subjectWise)
  };
};

const getChildMarks = async (studentId, { subjectId, examType }) => {
  const where = { studentId };
  if (subjectId) where.subjectId = subjectId;
  if (examType) where.examType = examType;

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

  const theoryMarks = marks.filter(m => m.examType === 'THEORY');
  const compMarks = marks.filter(m => m.examType === 'COMPETITIVE');

  return {
    allMarks: marks,
    theory: {
      tests: theoryMarks,
      average: theoryMarks.length > 0
        ? (theoryMarks.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / theoryMarks.length).toFixed(2)
        : 0
    },
    competitive: {
      tests: compMarks,
      average: compMarks.length > 0
        ? (compMarks.reduce((s, m) => s + (m.marks / m.maxMarks) * 100, 0) / compMarks.length).toFixed(2)
        : 0
    },
    analysis
  };
};

const getChildFees = async (studentId) => {
  const fees = await prisma.fee.findMany({
    where: { studentId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const summary = {
    total: fees.reduce((s, f) => s + f.totalAmount, 0),
    paid: fees.reduce((s, f) => s + f.paidAmount, 0),
    pending: fees.reduce((s, f) => s + f.remainingAmount, 0),
    count: fees.length,
    paidCount: fees.filter(f => f.status === 'PAID').length,
    pendingCount: fees.filter(f => f.status === 'PENDING' || f.status === 'OVERDUE').length
  };

  return { fees, summary };
};

const getAnnouncements = async () => {
  return prisma.announcement.findMany({
    where: {
      OR: [
        { audience: 'ALL' },
        { audience: 'PARENTS' },
        { audience: 'STUDENTS' }
      ],
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } }
      ]
    },
    include: { user: { select: { name: true } } },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });
};

export const parentService = {
  getDashboard,
  getChildAttendance,
  getChildMarks,
  getChildFees,
  getAnnouncements
};
