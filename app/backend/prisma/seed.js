import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@college.edu',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      admin: {
        create: {
          adminId: 'ADM001'
        }
      }
    }
  });
  console.log('Admin created:', adminUser.email);

  const subjectsData = [
    { name: 'Mathematics', code: 'MATH', maxMarks: 100 },
    { name: 'Physics', code: 'PHY', maxMarks: 100 },
    { name: 'Chemistry', code: 'CHEM', maxMarks: 100 },
    { name: 'Biology', code: 'BIO', maxMarks: 100 },
    { name: 'Computer Science', code: 'CS', maxMarks: 100 },
    { name: 'English', code: 'ENG', maxMarks: 100 },
    { name: 'Hindi', code: 'HIN', maxMarks: 100 },
    { name: 'Kannada', code: 'KAN', maxMarks: 100 },
    { name: 'Sanskrit', code: 'SAN', maxMarks: 100 },
  ];

  for (const s of subjectsData) {
    await prisma.subject.create({ data: s }).catch(() => null);
  }
  console.log('Subjects created');

  const class11 = await prisma.class.create({
    data: { name: 'Class 11', level: 11 }
  });
  const class12 = await prisma.class.create({
    data: { name: 'Class 12', level: 12 }
  });
  console.log('Classes created');

  await prisma.section.create({ data: { name: 'A', classId: class11.id } });
  await prisma.section.create({ data: { name: 'B', classId: class11.id } });
  await prisma.section.create({ data: { name: 'C', classId: class11.id } });
  await prisma.section.create({ data: { name: 'A', classId: class12.id } });
  await prisma.section.create({ data: { name: 'B', classId: class12.id } });
  await prisma.section.create({ data: { name: 'C', classId: class12.id } });
  console.log('Sections created');

  const allSections = await prisma.section.findMany();
  const mathSubject = await prisma.subject.findFirst({ where: { code: 'MATH' } });
  const phySubject = await prisma.subject.findFirst({ where: { code: 'PHY' } });

  const sectionA11 = allSections.find(s => s.name === 'A' && s.classId === class11.id);
  const sectionA12 = allSections.find(s => s.name === 'A' && s.classId === class12.id);

  const teacherUser = await prisma.user.create({
    data: {
      name: 'John Smith',
      email: 'teacher@college.edu',
      passwordHash: await bcrypt.hash('teacher123', 10),
      role: 'TEACHER',
      isActive: true,
      teacher: {
        create: {
          employeeId: 'EMP001',
          subjectId: mathSubject?.id,
          classId: class11.id,
          sectionId: sectionA11?.id,
          qualification: 'M.Sc Mathematics'
        }
      }
    },
    include: { teacher: true }
  });
  console.log('Teacher created:', teacherUser.email);

  const teacherUser2 = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'teacher2@college.edu',
      passwordHash: await bcrypt.hash('teacher123', 10),
      role: 'TEACHER',
      isActive: true,
      teacher: {
        create: {
          employeeId: 'EMP002',
          subjectId: phySubject?.id,
          classId: class12.id,
          sectionId: sectionA12?.id,
          qualification: 'M.Sc Physics'
        }
      }
    },
    include: { teacher: true }
  });
  console.log('Teacher 2 created:', teacherUser2.email);

  const student1 = await prisma.student.create({
    data: {
      studentId: 'STU001',
      rollNumber: '1',
      name: 'Alice Brown',
      classId: class11.id,
      sectionId: sectionA11.id,
      fatherName: 'Robert Brown',
      motherName: 'Mary Brown',
      phone: '+911234567890',
      email: 'alice@student.edu',
      address: '123 Main St, Bangalore',
      admissionYear: 2024,
      dob: new Date('2008-03-15'),
      status: 'ACTIVE',
      parents: {
        create: {
          name: 'Robert Brown',
          relation: 'Father',
          phone: '+911234567890',
          email: 'robert@email.com',
          isPrimary: true,
          password: await bcrypt.hash('567890', 10)
        }
      }
    }
  });
  console.log('Student created:', student1.studentId);

  const student2 = await prisma.student.create({
    data: {
      studentId: 'STU002',
      rollNumber: '2',
      name: 'Bob Wilson',
      classId: class11.id,
      sectionId: sectionA11.id,
      fatherName: 'David Wilson',
      motherName: 'Susan Wilson',
      phone: '+919876543210',
      email: 'bob@student.edu',
      address: '456 Park Ave, Bangalore',
      admissionYear: 2024,
      dob: new Date('2007-07-22'),
      status: 'ACTIVE'
    }
  });
  console.log('Student 2 created:', student2.studentId);

  await prisma.announcement.create({
    data: {
      title: 'Welcome to New Academic Year 2024-25',
      description: 'Welcome all students and parents to the new academic year. Classes begin on June 1st.',
      audience: 'ALL',
      priority: 'HIGH',
      createdBy: adminUser.id
    }
  });

  await prisma.announcement.create({
    data: {
      title: 'Parent-Teacher Meeting',
      description: 'PTM scheduled for July 15th. All parents are requested to attend.',
      audience: 'PARENTS',
      priority: 'NORMAL',
      createdBy: adminUser.id
    }
  });
  console.log('Announcements created');

  await prisma.fee.create({
    data: {
      studentId: student1.id,
      totalAmount: 50000,
      paidAmount: 25000,
      remainingAmount: 25000,
      status: 'PARTIAL',
      dueDate: new Date('2024-06-30'),
      description: 'Annual Tuition Fee 2024-25'
    }
  });

  await prisma.fee.create({
    data: {
      studentId: student2.id,
      totalAmount: 50000,
      paidAmount: 0,
      remainingAmount: 50000,
      status: 'PENDING',
      dueDate: new Date('2024-06-30'),
      description: 'Annual Tuition Fee 2024-25'
    }
  });
  console.log('Fees created');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.attendance.create({
    data: {
      studentId: student1.id,
      classId: class11.id,
      sectionId: sectionA11.id,
      subjectId: mathSubject?.id,
      date: yesterday,
      status: 'PRESENT',
      teacherId: teacherUser.teacher?.id
    }
  });
  await prisma.attendance.create({
    data: {
      studentId: student2.id,
      classId: class11.id,
      sectionId: sectionA11.id,
      subjectId: mathSubject?.id,
      date: yesterday,
      status: 'PRESENT',
      teacherId: teacherUser.teacher?.id
    }
  });
  console.log('Attendance records created');

  await prisma.mark.create({
    data: {
      studentId: student1.id,
      subjectId: mathSubject.id,
      examType: 'THEORY',
      testName: 'Unit Test 1',
      marks: 85,
      maxMarks: 100,
      remarks: 'Good performance',
      createdBy: teacherUser.teacher?.id
    }
  });

  await prisma.mark.create({
    data: {
      studentId: student2.id,
      subjectId: mathSubject.id,
      examType: 'THEORY',
      testName: 'Unit Test 1',
      marks: 72,
      maxMarks: 100,
      remarks: 'Can improve',
      createdBy: teacherUser.teacher?.id
    }
  });
  console.log('Marks created');

  console.log('Seed completed successfully!');
  console.log('');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Admin: admin@college.edu / admin123');
  console.log('Teacher: teacher@college.edu / teacher123');
  console.log('Teacher2: teacher2@college.edu / teacher123');
  console.log('Parent: studentId=STU001, phone=+911234567890');
  console.log('========================');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
