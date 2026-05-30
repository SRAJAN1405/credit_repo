import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserRole } from './models/User';

dotenv.config();

const seedUsers: { name: string; email: string; password: string; role: UserRole; phone: string }[] = [
  {
    name: 'Admin User',
    email: 'admin@lms.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9000000001',
  },
  {
    name: 'Sales Executive',
    email: 'sales@lms.com',
    password: 'Sales@123',
    role: 'sales',
    phone: '9000000002',
  },
  {
    name: 'Sanction Executive',
    email: 'sanction@lms.com',
    password: 'Sanction@123',
    role: 'sanction',
    phone: '9000000003',
  },
  {
    name: 'Disbursement Executive',
    email: 'disbursement@lms.com',
    password: 'Disburse@123',
    role: 'disbursement',
    phone: '9000000004',
  },
  {
    name: 'Collection Executive',
    email: 'collection@lms.com',
    password: 'Collect@123',
    role: 'collection',
    phone: '9000000005',
  },
  {
    name: 'Test Borrower',
    email: 'borrower@lms.com',
    password: 'Borrow@123',
    role: 'borrower',
    phone: '9000000006',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('✅ Connected to MongoDB');

    // Upsert each user
    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`⚠️  User already exists: ${userData.email}`);
      } else {
        await User.create(userData);
        console.log(`✅ Created: ${userData.role} — ${userData.email} / ${userData.password}`);
      }
    }

    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────────────────────');
    seedUsers.forEach((u) => {
      console.log(`${u.role.padEnd(14)} ${u.email.padEnd(30)} ${u.password}`);
    });
    console.log('─────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
