import { z } from 'zod';

// username: letters, numbers, and hyphens, 3-30 chars.
const username = z
  .string()
  .trim()
  .min(3, 'Username must be 3-30 characters')
  .max(30, 'Username must be 3-30 characters')
  .regex(/^[a-zA-Z0-9-]+$/, 'Username may only contain letters, numbers, and hyphens');

export const registerSchema = z.object({
  email: z.email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username,
});

export const loginSchema = z.object({
  email: z.email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const usernameParamSchema = z.object({
  username,
});

// All profile fields are optional; a null clears the field. username and email
// changes are intentionally out of scope here (handled by dedicated endpoints
// later), so they're not accepted.
export const updateMeSchema = z.object({
  firstName: z.string().max(100).nullish(),
  lastName: z.string().max(100).nullish(),
  bio: z.string().max(2000).nullish(),
  professionalTitle: z.string().max(150).nullish(),
  yearsOfExperience: z
    .number()
    .int()
    .min(0)
    .max(100, 'yearsOfExperience must be an integer between 0 and 100')
    .nullish(),
  phone: z.string().max(30).nullish(),
  location: z.string().max(150).nullish(),
  profilePhotoUrl: z.url('profilePhotoUrl must be a valid URL').nullish(),
});
