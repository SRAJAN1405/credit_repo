import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { Loan } from '../models/Loan';
import mongoose from 'mongoose';

const router = Router();

// POST /api/payments - Record a payment
router.post(
  '/',
  authenticate,
  authorize('collection', 'admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { loanId, utrNumber, amount, paymentDate } = req.body;

      if (!loanId || !utrNumber || !amount || !paymentDate) {
        res.status(400).json({ message: 'Loan ID, UTR number, amount, and payment date are required.' });
        return;
      }

      const loan = await Loan.findById(loanId);
      if (!loan) {
        res.status(404).json({ message: 'Loan not found.' });
        return;
      }

      if (loan.status !== 'disbursed') {
        res.status(400).json({ message: `Cannot record payment for a loan with status: ${loan.status}` });
        return;
      }

      // Check UTR uniqueness
      const existingUTR = await Payment.findOne({ utrNumber: utrNumber.toUpperCase().trim() });
      if (existingUTR) {
        res.status(409).json({ message: 'UTR number already exists. Each payment must have a unique UTR.' });
        return;
      }

      const paymentAmount = Number(amount);

      // Validate amount
      if (paymentAmount <= 0) {
        res.status(400).json({ message: 'Payment amount must be greater than 0.' });
        return;
      }

      if (paymentAmount > loan.outstandingBalance) {
        res.status(400).json({
          message: `Payment amount (₹${paymentAmount}) cannot exceed outstanding balance (₹${loan.outstandingBalance.toFixed(2)}).`,
        });
        return;
      }

      // Create payment
      const payment = await Payment.create({
        loan: new mongoose.Types.ObjectId(loanId),
        borrower: loan.borrower,
        utrNumber: utrNumber.toUpperCase().trim(),
        amount: paymentAmount,
        paymentDate: new Date(paymentDate),
        recordedBy: new mongoose.Types.ObjectId(req.user!.id),
      });

      // Update loan
      loan.totalPaid = loan.totalPaid + paymentAmount;
      loan.outstandingBalance = loan.outstandingBalance - paymentAmount;

      // Auto-close if fully paid
      if (loan.outstandingBalance <= 0.01) {
        loan.outstandingBalance = 0;
        loan.status = 'closed';
        loan.closedAt = new Date();
      }

      await loan.save();

      res.status(201).json({
        message: loan.status === 'closed'
          ? 'Payment recorded. Loan fully repaid and closed!'
          : 'Payment recorded successfully.',
        payment,
        loan: {
          id: loan._id,
          status: loan.status,
          totalPaid: loan.totalPaid,
          outstandingBalance: loan.outstandingBalance,
          totalRepayment: loan.loanConfig.totalRepayment,
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({ message: 'Failed to record payment.' });
    }
  }
);

// GET /api/payments/loan/:loanId
router.get(
  '/loan/:loanId',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const loan = await Loan.findById(req.params.loanId);
      if (!loan) {
        res.status(404).json({ message: 'Loan not found.' });
        return;
      }

      // Borrowers can only see their own loan payments
      if (req.user!.role === 'borrower' && loan.borrower.toString() !== req.user!.id) {
        res.status(403).json({ message: 'Access denied.' });
        return;
      }

      const payments = await Payment.find({ loan: req.params.loanId })
        .sort({ paymentDate: -1 })
        .populate('recordedBy', 'name');

      res.json({ payments });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch payments.' });
    }
  }
);

export default router;
