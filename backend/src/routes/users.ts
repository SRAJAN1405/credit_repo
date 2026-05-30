import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Loan } from '../models/Loan';

const router = Router();

// GET /api/users/leads - Sales module: users who haven't applied yet
router.get(
  '/leads',
  authenticate,
  authorize('sales', 'admin'),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Get all borrowers
      const borrowers = await User.find({ role: 'borrower' })
        .select('-password')
        .sort({ createdAt: -1 });

      // Get borrowers who have applied
      const appliedBorrowerIds = await Loan.distinct('borrower');

      // Leads = borrowers who haven't applied
      const leads = borrowers.map((b) => ({
        ...b.toObject(),
        hasApplied: appliedBorrowerIds.map((id) => id.toString()).includes(b._id.toString()),
      }));

      res.json({ leads });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch leads.' });
    }
  }
);

export default router;
