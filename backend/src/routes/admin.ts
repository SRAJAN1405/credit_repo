import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { Loan } from '../models/Loan';
import { User } from '../models/User';
import { Payment } from '../models/Payment';

const router = Router();

// GET /api/admin/stats
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const [
        totalLoans,
        appliedLoans,
        sanctionedLoans,
        disbursedLoans,
        closedLoans,
        rejectedLoans,
        totalBorrowers,
        totalPayments,
      ] = await Promise.all([
        Loan.countDocuments(),
        Loan.countDocuments({ status: 'applied' }),
        Loan.countDocuments({ status: 'sanctioned' }),
        Loan.countDocuments({ status: 'disbursed' }),
        Loan.countDocuments({ status: 'closed' }),
        Loan.countDocuments({ status: 'rejected' }),
        User.countDocuments({ role: 'borrower' }),
        Payment.countDocuments(),
      ]);

      const totalDisbursedAmount = await Loan.aggregate([
        { $match: { status: { $in: ['disbursed', 'closed'] } } },
        { $group: { _id: null, total: { $sum: '$loanConfig.amount' } } },
      ]);

      res.json({
        stats: {
          totalLoans,
          appliedLoans,
          sanctionedLoans,
          disbursedLoans,
          closedLoans,
          rejectedLoans,
          totalBorrowers,
          totalPayments,
          totalDisbursedAmount: totalDisbursedAmount[0]?.total || 0,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stats.' });
    }
  }
);

export default router;
