import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { Loan } from '../models/Loan';
import { runBRE, calculateLoanFinancials } from '../utils/bre';
import mongoose from 'mongoose';

const router = Router();

// POST /api/loans/check-eligibility
// BRE check before creating the loan
router.post(
  '/check-eligibility',
  authenticate,
  authorize('borrower'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { dateOfBirth, monthlySalary, pan, employmentMode } = req.body;

      if (!dateOfBirth || !monthlySalary || !pan || !employmentMode) {
        res.status(400).json({ message: 'All personal details are required.' });
        return;
      }

      const breResult = runBRE({
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        pan: String(pan),
        employmentMode: String(employmentMode),
      });

      if (!breResult.passed) {
        res.status(422).json({
          message: 'Eligibility check failed.',
          passed: false,
          errors: breResult.errors,
        });
        return;
      }

      res.json({ message: 'Eligibility check passed.', passed: true });
    } catch (error) {
      res.status(500).json({ message: 'Eligibility check failed.' });
    }
  }
);

// POST /api/loans/upload-salary-slip
router.post(
  '/upload-salary-slip',
  authenticate,
  authorize('borrower'),
  upload.single('salarySlip'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      res.json({
        message: 'Salary slip uploaded successfully.',
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
      });
    } catch (error) {
      res.status(500).json({ message: 'File upload failed.' });
    }
  }
);

// POST /api/loans/apply
router.post(
  '/apply',
  authenticate,
  authorize('borrower'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        fullName, pan, dateOfBirth, monthlySalary, employmentMode,
        salarySlip, amount, tenure,
      } = req.body;

      if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode || !amount || !tenure) {
        res.status(400).json({ message: 'All fields are required.' });
        return;
      }

      // Run BRE again on server for safety
      const breResult = runBRE({
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        pan: String(pan),
        employmentMode: String(employmentMode),
      });

      if (!breResult.passed) {
        res.status(422).json({
          message: 'Application rejected by eligibility rules.',
          errors: breResult.errors,
        });
        return;
      }

      // Validate loan config
      const loanAmount = Number(amount);
      const loanTenure = Number(tenure);

      if (loanAmount < 50000 || loanAmount > 500000) {
        res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,00,000.' });
        return;
      }

      if (loanTenure < 30 || loanTenure > 365) {
        res.status(400).json({ message: 'Loan tenure must be between 30 and 365 days.' });
        return;
      }

      // Check for existing active loan
      const existingLoan = await Loan.findOne({
        borrower: req.user!.id,
        status: { $in: ['applied', 'sanctioned', 'disbursed'] },
      });

      if (existingLoan) {
        res.status(409).json({ message: 'You already have an active loan application.' });
        return;
      }

      const { simpleInterest, totalRepayment } = calculateLoanFinancials(loanAmount, loanTenure);

      const loan = await Loan.create({
        borrower: new mongoose.Types.ObjectId(req.user!.id),
        personalDetails: {
          fullName: fullName.trim(),
          pan: pan.toUpperCase().trim(),
          dateOfBirth: new Date(dateOfBirth),
          monthlySalary: Number(monthlySalary),
          employmentMode,
        },
        salarySlip: salarySlip || undefined,
        loanConfig: {
          amount: loanAmount,
          tenure: loanTenure,
          interestRate: 12,
          simpleInterest,
          totalRepayment,
        },
        status: 'applied',
        totalPaid: 0,
        outstandingBalance: totalRepayment,
      });

      res.status(201).json({
        message: 'Loan application submitted successfully.',
        loan,
      });
    } catch (error) {
      console.error('Apply error:', error);
      res.status(500).json({ message: 'Failed to submit loan application.' });
    }
  }
);

// GET /api/loans/my-loans
router.get(
  '/my-loans',
  authenticate,
  authorize('borrower'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const loans = await Loan.find({ borrower: req.user!.id })
        .sort({ createdAt: -1 })
        .populate('sanctionedBy', 'name email')
        .populate('disbursedBy', 'name email');

      res.json({ loans });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch loans.' });
    }
  }
);

// GET /api/loans/:id
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const loan = await Loan.findById(req.params.id)
        .populate('borrower', 'name email phone')
        .populate('sanctionedBy', 'name email')
        .populate('disbursedBy', 'name email');

      if (!loan) {
        res.status(404).json({ message: 'Loan not found.' });
        return;
      }

      // Borrowers can only see their own loans
      if (req.user!.role === 'borrower' && loan.borrower._id.toString() !== req.user!.id) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      res.json({ loan });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch loan.' });
    }
  }
);

// PATCH /api/loans/:id/sanction - Sanction or reject a loan
router.patch(
  '/:id/sanction',
  authenticate,
  authorize('sanction', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'

      const loan = await Loan.findById(req.params.id);
      if (!loan) {
        res.status(404).json({ message: 'Loan not found.' });
        return;
      }

      if (loan.status !== 'applied') {
        res.status(400).json({ message: `Cannot sanction a loan with status: ${loan.status}` });
        return;
      }

      if (action === 'approve') {
        loan.status = 'sanctioned';
        loan.sanctionedBy = new mongoose.Types.ObjectId(req.user!.id);
        loan.sanctionedAt = new Date();
      } else if (action === 'reject') {
        if (!rejectionReason) {
          res.status(400).json({ message: 'Rejection reason is required.' });
          return;
        }
        loan.status = 'rejected';
        loan.rejectionReason = rejectionReason;
      } else {
        res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
        return;
      }

      await loan.save();
      res.json({ message: `Loan ${action === 'approve' ? 'sanctioned' : 'rejected'} successfully.`, loan });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update loan status.' });
    }
  }
);

// PATCH /api/loans/:id/disburse
router.patch(
  '/:id/disburse',
  authenticate,
  authorize('disbursement', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const loan = await Loan.findById(req.params.id);
      if (!loan) {
        res.status(404).json({ message: 'Loan not found.' });
        return;
      }

      if (loan.status !== 'sanctioned') {
        res.status(400).json({ message: `Cannot disburse a loan with status: ${loan.status}` });
        return;
      }

      loan.status = 'disbursed';
      loan.disbursedBy = new mongoose.Types.ObjectId(req.user!.id);
      loan.disbursedAt = new Date();

      await loan.save();
      res.json({ message: 'Loan disbursed successfully.', loan });
    } catch (error) {
      res.status(500).json({ message: 'Failed to disburse loan.' });
    }
  }
);

// GET /api/loans - For executives (filtered by their module)
router.get(
  '/',
  authenticate,
  authorize('admin', 'sanction', 'disbursement', 'collection', 'sales'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { status, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let query: Record<string, unknown> = {};

      // Filter by role if not admin
      if (req.user!.role !== 'admin') {
        if (req.user!.role === 'sanction') {
          query.status = 'applied';
        } else if (req.user!.role === 'disbursement') {
          query.status = 'sanctioned';
        } else if (req.user!.role === 'collection') {
          query.status = 'disbursed';
        }
        // sales sees users, not loans — handled separately
      }

      if (status) {
        query.status = status;
      }

      const [loans, total] = await Promise.all([
        Loan.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('borrower', 'name email phone')
          .populate('sanctionedBy', 'name')
          .populate('disbursedBy', 'name'),
        Loan.countDocuments(query),
      ]);

      res.json({
        loans,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch loans.' });
    }
  }
);

export default router;
