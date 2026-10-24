import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { UserRole } from '../types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-brandguard-jwt-key-hackathon-2026';

export const generateToken = (payload: { id: string; email: string; role: string; workspaceId: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      workspaceId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { memberships: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found or revoked.' });
      return;
    }

    const membership = user.memberships[0];
    const workspaceId = membership ? membership.workspaceId : decoded.workspaceId;

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      workspaceId,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};
