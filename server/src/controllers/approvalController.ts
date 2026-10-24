import { Request, Response } from 'express';
import { ApprovalService } from '../services/approvalService';

export const submitForReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const review = await ApprovalService.submitReview(id, userId);
    res.json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit review.' });
  }
};

export const requestChanges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { reason } = req.body;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!reason) {
      res.status(400).json({ error: 'A reason is required when requesting changes.' });
      return;
    }

    const review = await ApprovalService.requestChanges(id, userId, userRole, reason);
    res.json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to request changes.' });
  }
};

export const approveReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { reason } = req.body;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const review = await ApprovalService.approveReview(id, userId, userRole, reason);
    res.json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to approve review.' });
  }
};

export const rejectReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { reason } = req.body;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!reason) {
      res.status(400).json({ error: 'Reason is required for rejecting content.' });
      return;
    }

    const review = await ApprovalService.rejectReview(id, userId, userRole, reason);
    res.json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reject review.' });
  }
};
