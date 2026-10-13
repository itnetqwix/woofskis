import * as Yup from 'yup';

/**
 * Yup validation schemas for forms across COS
 */

export const emailValidation = Yup.string()
  .trim()
  .required('Email is required')
  .email('Please enter a valid email address');

export const passwordValidation = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .matches(/[0-9]/, 'Password must contain at least one number');

export const usernameValidation = Yup.string()
  .trim()
  .required('Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .matches(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and dashes'
  );

export const loginSchema = Yup.object().shape({
  email: emailValidation,
  password: Yup.string().required('Password is required'),
  rememberMe: Yup.boolean().default(false),
});

export const registerSchema = Yup.object().shape({
  username: usernameValidation,
  email: emailValidation,
  password: passwordValidation,
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

export const contestCreateSchema = Yup.object().shape({
  title: Yup.string().trim().required('Contest title is required').min(3).max(100),
  tagline: Yup.string().trim().max(160, 'Tagline cannot exceed 160 characters'),
  description: Yup.string().trim().required('Contest description is required'),
  format: Yup.string()
    .oneOf(['individual', 'team', 'hackathon', 'bracket_tournament'])
    .required('Contest format is required'),
  registrationStartDate: Yup.date().required('Registration start date is required'),
  registrationEndDate: Yup.date()
    .required('Registration end date is required')
    .min(
      Yup.ref('registrationStartDate'),
      'Registration end date must be after registration start date'
    ),
  startDate: Yup.date().required('Contest start date is required'),
  endDate: Yup.date()
    .required('Contest end date is required')
    .min(Yup.ref('startDate'), 'Contest end date must be after start date'),
});

export const submissionSchema = Yup.object().shape({
  title: Yup.string().trim().required('Submission title is required').min(3).max(100),
  description: Yup.string().trim().required('Submission description is required'),
  repoUrl: Yup.string().url('Must be a valid repository URL').nullable(),
  demoUrl: Yup.string().url('Must be a valid live demo URL').nullable(),
});
