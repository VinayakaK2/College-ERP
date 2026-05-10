import { prisma } from '../config/database.js';

const getDashboardAnalytics = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    activeStudents,
    transferredStudents,
    recentAttendance,
    feesData,
    marksData,
    announcementsCount,
    recentLogins
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.student.count({ where: { status: 'TRANSFERRED' } }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: {
        date: { gte: thirtyDaysAgo }
      },
      _count: true
    }),
    prisma.fee.aggregate({
      _sum: { totalAmount: true, paidAmount: true, remainingAmount: true }
    }),
    prisma.mark.aggregate({
      _avg: { marks: true },
      _count: true
    }),
    prisma.announcement.count({
      where: {
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: now } }
        ]
      }
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: thirtyDaysAgo } }
    })
  ]);

  const attendanceBreakdown = {};
  recentAttendance.forEach(a => {
    attendanceBreakdown[a.status] = a._count;
  });

  const feesByStatus = await prisma.fee.groupBy({
    by: ['status'],
    _count: true,
    _sum: { remainingAmount: true }
  });

  return {
    overview: {
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      transferredStudents,
      announcementsCount,
      recentLogins
    },
    attendance: attendanceBreakdown,
    fees: {
      totalCollected: feesData._sum.paidAmount || 0,
      totalPending: feesData._sum.remainingAmount || 0,
      totalExpected: feesData._sum.totalAmount || 0,
      byStatus: feesByStatus
    },
    marks: {
      averageMarks: marksData._avg.marks ? marksData._avg.marks.toFixed(2) : 0,
      totalTests: marksData._count
    }
  };
};

const getClassAnalytics = async (classId) => {
  const [students, subjects, marks, attendance] = await Promise.all([
    prisma.student.findMany({
      where: { classId, status: 'ACTIVE' },
      select: { id: true, name: true, rollNumber: true }
    }),
    prisma.classSubject.findMany({
      where: { classId },
      include: { subject: true }
    }),
    prisma.mark.findMany({
      where: {
        student: { classId }
      },
      include: {
        student: { select: { name: true, rollNumber: true } },
        subject: true
      }
    }),
    prisma.attendance.findMany({
      where: {
        student: { classId }
      }
    })
  ]);

  const studentPerformance = students.map(s => {
    const studentMarks = marks.filter(m => m.studentId === s.id);
    const totalScore = studentMarks.reduce((sum, m) => sum + (m.marks / m.maxMarks) * 100, 0);
    const avg = studentMarks.length > 0 ? (totalScore / studentMarks.length).toFixed(2) : 0;
    return { ...s, average: parseFloat(avg), testCount: studentMarks.length };
  }).sort((a, b) => b.average - a.average);

  const subjectPerformance = {};
  marks.forEach(m => {
    const sid = m.subjectId;
    if (!subjectPerformance[sid]) {
      subjectPerformance[sid] = { subject: m.subject, total: 0, max: 0, count: 0 };
    }
    subjectPerformance[sid].total += m.marks;
    subjectPerformance[sid].max += m.maxMarks;
    subjectPerformance[sid].count++;
  });

  const subjectAverages = Object.values(subjectPerformance).map(s => ({
    subject: s.subject,
    average: s.max > 0 ? ((s.total / s.max) * 100).toFixed(2) : 0,
    testCount: s.count
  }));

  const totalAtt = attendance.length;
  const presentAtt = attendance.filter(a => a.status === 'PRESENT').length;

  return {
    studentCount: students.length,
    subjectCount: subjects.length,
    toppers: studentPerformance.slice(0, 5),
    lowPerformers: studentPerformance.slice(-5).reverse(),
    subjectAverages,
    attendance: {
      total: totalAtt,
      present: presentAtt,
      percentage: totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(2) : 0
    }
  };
};

const getStudentAnalytics = async (studentId) => {
  const marks = await prisma.mark.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { createdAt: 'asc' }
  });

  const subjectProgress = {};
  marks.forEach(m => {
    const sid = m.subjectId;
    if (!subjectProgress[sid]) {
      subjectProgress[sid] = { subject: m.subject, scores: [] };
    }
    subjectProgress[sid].scores.push({
      date: m.createdAt,
      percentage: (m.marks / m.maxMarks) * 100,
      testName: m.testName
    });
  });

  const subjectAverages = Object.values(subjectProgress).map(sp => ({
    subject: sp.subject,
    average: (sp.scores.reduce((s, sc) => s + sc.percentage, 0) / sp.scores.length).toFixed(2),
    tests: sp.scores.length,
    trend: sp.scores.length > 1
      ? (sp.scores[sp.scores.length - 1].percentage - sp.scores[0].percentage).toFixed(2)
      : 0
  }));

  const strongest = subjectAverages.length > 0
    ? subjectAverages.reduce((a, b) => parseFloat(a.average) > parseFloat(b.average) ? a : b)
    : null;

  const weakest = subjectAverages.length > 0
    ? subjectAverages.reduce((a, b) => parseFloat(a.average) < parseFloat(b.average) ? a : b)
    : null;

  return {
    subjectAverages,
    strongestSubject: strongest,
    weakestSubject: weakest,
    totalTests: marks.length,
    progress: subjectProgress
  };
};

const getAttendanceAnalytics = async ({ classId, sectionId, month, year }) => {
  const where = {};
  if (classId) where.classId = classId;
  if (sectionId) where.sectionId = sectionId;

  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      student: { select: { name: true, rollNumber: true } },
      subject: true
    }
  });

  const total = records.length;
  const byStatus = {};
  const byStudent = {};
  const byDate = {};

  records.forEach(r => {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;

    const sid = r.studentId;
    if (!byStudent[sid]) {
      byStudent[sid] = { student: r.student, total: 0, present: 0 };
    }
    byStudent[sid].total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') byStudent[sid].present++;

    const d = r.date.toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = { total: 0, present: 0 };
    byDate[d].total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') byDate[d].present++;
  });

  const studentAttendance = Object.values(byStudent)
    .map(s => ({
      ...s,
      percentage: s.total > 0 ? ((s.present / s.total) * 100).toFixed(2) : 0
    }))
    .sort((a, b) => parseFloat(a.percentage) - parseFloat(b.percentage));

  return {
    total,
    byStatus,
    lowAttendanceStudents: studentAttendance.filter(s => parseFloat(s.percentage) < 75),
    dailyTrend: Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        percentage: data.total > 0 ? ((data.present / data.total) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
};

const getFeesAnalytics = async () => {
  const byStatus = await prisma.fee.groupBy({
    by: ['status'],
    _count: true,
    _sum: { totalAmount: true, paidAmount: true, remainingAmount: true }
  });

  const fees = await prisma.fee.findMany({
    include: {
      student: { select: { name: true, class: true, section: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const overdueFees = fees.filter(f => f.status === 'OVERDUE');

  return {
    byStatus,
    totalExpected: byStatus.reduce((s, b) => s + (b._sum.totalAmount || 0), 0),
    totalCollected: byStatus.reduce((s, b) => s + (b._sum.paidAmount || 0), 0),
    totalPending: byStatus.reduce((s, b) => s + (b._sum.remainingAmount || 0), 0),
    overdueCount: overdueFees.length,
    recentFees: fees.slice(0, 20)
  };
};

export const analyticsService = {
  getDashboardAnalytics,
  getClassAnalytics,
  getStudentAnalytics,
  getAttendanceAnalytics,
  getFeesAnalytics
};
