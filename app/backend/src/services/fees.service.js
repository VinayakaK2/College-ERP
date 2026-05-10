import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { auditLog } from './audit.service.js';

const getFees = async (filters, { page, limit, skip }) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.search) {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { studentId: { contains: filters.search, mode: 'insensitive' } }
        ]
      },
      select: { id: true }
    });
    where.studentId = { in: students.map(s => s.id) };
  }

  const [fees, total] = await Promise.all([
    prisma.fee.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { name: true, studentId: true, rollNumber: true, class: true, section: true } },
        transactions: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.fee.count({ where })
  ]);

  return { fees, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const createFee = async (data) => {
  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) {
    throw new AppError('Student not found', 404, 'NOT_FOUND');
  }

  const fee = await prisma.fee.create({
    data: {
      studentId: data.studentId,
      totalAmount: data.totalAmount,
      paidAmount: 0,
      remainingAmount: data.totalAmount,
      status: 'PENDING',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      description: data.description
    },
    include: {
      student: { select: { name: true, studentId: true } },
      transactions: true
    }
  });

  return fee;
};

const getFee = async (id) => {
  const fee = await prisma.fee.findUnique({
    where: { id },
    include: {
      student: { select: { name: true, studentId: true, rollNumber: true, class: true, section: true } },
      transactions: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!fee) {
    throw new AppError('Fee record not found', 404, 'NOT_FOUND');
  }

  return fee;
};

const updateFee = async (id, data) => {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) {
    throw new AppError('Fee record not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.fee.update({
    where: { id },
    data: {
      totalAmount: data.totalAmount,
      remainingAmount: data.totalAmount !== undefined
        ? data.totalAmount - fee.paidAmount
        : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      description: data.description
    },
    include: {
      student: { select: { name: true } },
      transactions: true
    }
  });

  await auditLog('UPDATE_FEE', 'Fee', id, fee);

  return updated;
};

const recordPayment = async (id, data) => {
  const fee = await prisma.fee.findUnique({ where: { id } });
  if (!fee) {
    throw new AppError('Fee record not found', 404, 'NOT_FOUND');
  }

  if (fee.remainingAmount <= 0) {
    throw new AppError('Fee already fully paid', 400, 'ALREADY_PAID');
  }

  if (data.amount > fee.remainingAmount) {
    throw new AppError(`Payment exceeds remaining amount of ${fee.remainingAmount}`, 400, 'OVERPAYMENT');
  }

  const newPaidAmount = fee.paidAmount + data.amount;
  const newRemaining = fee.totalAmount - newPaidAmount;

  let newStatus = 'PARTIAL';
  if (newRemaining <= 0) newStatus = 'PAID';
  else if (fee.dueDate && new Date() > fee.dueDate) newStatus = 'OVERDUE';

  const [updatedFee] = await prisma.$transaction([
    prisma.fee.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        status: newStatus,
        paymentDate: new Date()
      }
    }),
    prisma.transaction.create({
      data: {
        feeId: id,
        amount: data.amount,
        method: data.method,
        referenceNo: data.referenceNo,
        notes: data.notes
      }
    })
  ]);

  const result = await prisma.fee.findUnique({
    where: { id },
    include: {
      student: { select: { name: true, studentId: true } },
      transactions: { orderBy: { createdAt: 'desc' } }
    }
  });

  await auditLog('RECORD_PAYMENT', 'Fee', id, fee);

  return result;
};

const getStudentFees = async (studentId) => {
  return prisma.fee.findMany({
    where: { studentId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const feesService = {
  getFees,
  createFee,
  getFee,
  updateFee,
  recordPayment,
  getStudentFees
};
