import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  })
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only digits'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().uuid().required()
});

const createStudentSchema = Joi.object({
  studentId: Joi.string().required(),
  rollNumber: Joi.string().required(),
  name: Joi.string().min(2).max(100).required(),
  classId: Joi.string().uuid().required(),
  sectionId: Joi.string().uuid().required(),
  fatherName: Joi.string().max(100).allow('', null),
  motherName: Joi.string().max(100).allow('', null),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.string().max(500).allow('', null),
  admissionYear: Joi.number().integer().min(2000).max(2100).required(),
  dob: Joi.date().less('now').allow(null),
  parents: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      relation: Joi.string().required(),
      phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).required(),
      email: Joi.string().email().allow('', null),
      isPrimary: Joi.boolean()
    })
  ).optional()
});

const updateStudentSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  rollNumber: Joi.string(),
  classId: Joi.string().uuid(),
  sectionId: Joi.string().uuid(),
  fatherName: Joi.string().max(100).allow('', null),
  motherName: Joi.string().max(100).allow('', null),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.string().max(500).allow('', null),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'TRANSFERRED'),
  dob: Joi.date().less('now').allow(null)
}).min(1);

const createClassSchema = Joi.object({
  name: Joi.string().required(),
  level: Joi.number().integer().required()
});

const createSectionSchema = Joi.object({
  name: Joi.string().required(),
  classId: Joi.string().uuid().required()
});

const createTeacherSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).allow('', null),
  employeeId: Joi.string().required(),
  subjectId: Joi.string().uuid().allow('', null),
  classId: Joi.string().uuid().allow('', null),
  sectionId: Joi.string().uuid().allow('', null),
  qualification: Joi.string().allow('', null),
  password: Joi.string().min(6).required()
});

const markAttendanceSchema = Joi.object({
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().uuid().required(),
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'MEDICAL_LEAVE').required(),
      remarks: Joi.string().max(200).allow('', null)
    })
  ).min(1).required(),
  subjectId: Joi.string().uuid().allow('', null),
  classId: Joi.string().uuid().required(),
  sectionId: Joi.string().uuid().required(),
  date: Joi.date().required()
});

const createMarksSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  subjectId: Joi.string().uuid().required(),
  examType: Joi.string().valid('THEORY', 'COMPETITIVE').required(),
  testName: Joi.string().required(),
  marks: Joi.number().min(0).required(),
  maxMarks: Joi.number().min(1).required(),
  remarks: Joi.string().max(500).allow('', null)
});

const updateMarksSchema = Joi.object({
  marks: Joi.number().min(0),
  maxMarks: Joi.number().min(1),
  remarks: Joi.string().max(500).allow('', null)
}).min(1);

const createFeeSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  totalAmount: Joi.number().positive().required(),
  dueDate: Joi.date().allow(null),
  description: Joi.string().allow('', null)
});

const recordPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  method: Joi.string().allow('', null),
  referenceNo: Joi.string().allow('', null),
  notes: Joi.string().allow('', null)
});

const createAnnouncementSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(10).required(),
  audience: Joi.string().valid('ALL', 'STUDENTS', 'TEACHERS', 'PARENTS').required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT'),
  expiryDate: Joi.date().allow(null)
});

const createSubjectSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  maxMarks: Joi.number().integer().min(1).default(100)
});

const parentLoginSchema = Joi.object({
  studentId: Joi.string().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-]{10,15}$/).required()
});

const parentVerifyOtpSchema = Joi.object({
  studentId: Joi.string().required(),
  phone: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required()
});

export {
  loginSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  createStudentSchema,
  updateStudentSchema,
  createClassSchema,
  createSectionSchema,
  createTeacherSchema,
  markAttendanceSchema,
  createMarksSchema,
  updateMarksSchema,
  createFeeSchema,
  recordPaymentSchema,
  createAnnouncementSchema,
  createSubjectSchema,
  parentLoginSchema,
  parentVerifyOtpSchema
};
