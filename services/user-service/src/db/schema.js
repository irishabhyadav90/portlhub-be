import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Public handle, e.g. domain.com/username
  username: varchar('username', { length: 30 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  bio: text('bio'),
  professionalTitle: varchar('professional_title', { length: 150 }),
  yearsOfExperience: integer('years_of_experience'),
  phone: varchar('phone', { length: 30 }),
  location: varchar('location', { length: 150 }),
  profilePhotoUrl: text('profile_photo_url'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
