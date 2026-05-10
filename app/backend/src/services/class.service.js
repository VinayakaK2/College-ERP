import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

const getClasses = async () => {
  return prisma.class.findMany({
    include: {
      sections: true,
      _count: { select: { students: true, teachers: true } },
      subjects: { include: { subject: true } }
    },
    orderBy: { level: 'asc' }
  });
};

const createClass = async (data) => {
  const existing = await prisma.class.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new AppError('Class already exists', 409, 'DUPLICATE');
  }
  return prisma.class.create({ data });
};

const getClass = async (id) => {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      sections: true,
      students: {
        where: { status: 'ACTIVE' },
        include: { section: true }
      },
      teachers: {
        include: {
          user: { select: { name: true, email: true } },
          subject: true
        }
      },
      subjects: { include: { subject: true } }
    }
  });

  if (!cls) {
    throw new AppError('Class not found', 404, 'NOT_FOUND');
  }

  return cls;
};

const deleteClass = async (id) => {
  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) {
    throw new AppError('Class not found', 404, 'NOT_FOUND');
  }

  const studentCount = await prisma.student.count({ where: { classId: id } });
  if (studentCount > 0) {
    throw new AppError('Cannot delete class with enrolled students', 400, 'HAS_STUDENTS');
  }

  await prisma.class.delete({ where: { id } });
  return true;
};

const getSections = async (classId) => {
  return prisma.section.findMany({
    where: { classId },
    include: {
      _count: { select: { students: true } }
    },
    orderBy: { name: 'asc' }
  });
};

const createSection = async (data) => {
  const existing = await prisma.section.findUnique({
    where: { name_classId: { name: data.name, classId: data.classId } }
  });
  if (existing) {
    throw new AppError('Section already exists for this class', 409, 'DUPLICATE');
  }

  return prisma.section.create({
    data,
    include: { class: true }
  });
};

const getClassStudents = async (classId, sectionId) => {
  const where = { classId, status: { not: 'DELETED' } };
  if (sectionId) where.sectionId = sectionId;

  return prisma.student.findMany({
    where,
    include: {
      section: true,
      parents: true,
      _count: { select: { attendance: true, marks: true } }
    },
    orderBy: { rollNumber: 'asc' }
  });
};

export const classService = {
  getClasses,
  createClass,
  getClass,
  deleteClass,
  getSections,
  createSection,
  getClassStudents
};
