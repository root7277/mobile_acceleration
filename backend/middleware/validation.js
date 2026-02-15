const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 255 }),
  body('region').trim().notEmpty().withMessage('Region is required').isLength({ max: 100 }),
  body('district').trim().notEmpty().withMessage('District is required').isLength({ max: 100 }),
  body('neighborhood').trim().notEmpty().withMessage('Neighborhood is required').isLength({ max: 100 }),
  body('phone_number').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 20 }),
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscore'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const courseValidation = [
  body('course_id').trim().notEmpty().withMessage('Course ID is required').isLength({ max: 50 }),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('instructor_name').trim().notEmpty().withMessage('Instructor name is required').isLength({ max: 255 }),
  body('description').optional().trim()
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  courseValidation
};
