import mongoose, { Document, Schema } from 'mongoose';

export type LoanStatus =
  | 'applied'
  | 'sanctioned'
  | 'rejected'
  | 'disbursed'
  | 'closed';

export type EmploymentMode = 'salaried' | 'self_employed' | 'unemployed';

export interface IPersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface ILoanConfig {
  amount: number;       // Principal amount
  tenure: number;       // In days
  interestRate: number; // Fixed at 12% p.a.
  simpleInterest: number;
  totalRepayment: number;
}

export interface ILoan extends Document {
  _id: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  personalDetails: IPersonalDetails;
  salarySlip?: string; // file path
  loanConfig: ILoanConfig;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const personalDetailsSchema = new Schema<IPersonalDetails>(
  {
    fullName: { type: String, required: true },
    pan: { type: String, required: true, uppercase: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self_employed', 'unemployed'],
      required: true,
    },
  },
  { _id: false }
);

const loanConfigSchema = new Schema<ILoanConfig>(
  {
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
  },
  { _id: false }
);

const loanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    personalDetails: { type: personalDetailsSchema, required: true },
    salarySlip: { type: String },
    loanConfig: { type: loanConfigSchema, required: true },
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'applied',
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Loan = mongoose.model<ILoan>('Loan', loanSchema);
