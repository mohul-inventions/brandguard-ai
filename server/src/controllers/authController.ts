import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { generateToken } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'CREATOR', workspaceName } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Find or create workspace
    let workspace = await prisma.workspace.findFirst({
      where: { slug: 'novatech' },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: workspaceName || 'NovaTech Global',
          slug: (workspaceName || 'novatech').toLowerCase().replace(/\s+/g, '-'),
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        memberships: {
          create: {
            workspaceId: workspace.id,
            role,
          },
        },
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: workspace.id,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!user && (cleanEmail === 'brandmanager@novatech.io' || cleanEmail === 'manager@novatech.io')) {
      const altEmail = cleanEmail === 'brandmanager@novatech.io' ? 'manager@novatech.io' : 'brandmanager@novatech.io';
      user = await prisma.user.findUnique({
        where: { email: altEmail },
        include: { memberships: { include: { workspace: true } } },
      });
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    let isMatch = await bcrypt.compare(password, user.passwordHash);
    // Backward compatibility for demo accounts seeded with 'password123' or 'Password123!'
    if (!isMatch && (password === 'password123' || password === 'Password123!')) {
      const fallbackCheck = password === 'password123' ? 'Password123!' : 'password123';
      isMatch = await bcrypt.compare(fallbackCheck, user.passwordHash);
    }
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const membership = user.memberships[0];
    const workspaceId = membership ? membership.workspaceId : '';
    const workspaceName = membership ? membership.workspace.name : 'NovaTech Global';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        workspaceId,
        workspaceName,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
};

export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role = 'CREATOR' } = req.body;
    const roleEmailMap: Record<string, string> = {
      CREATOR: 'creator@novatech.io',
      BRAND_MANAGER: 'manager@novatech.io',
      REVIEWER: 'reviewer@novatech.io',
      ADMIN: 'admin@novatech.io',
    };

    // Support lookup by role or by direct email
    let targetEmail = roleEmailMap[role.toUpperCase()];
    if (!targetEmail && typeof role === 'string' && role.includes('@')) {
      targetEmail = role.toLowerCase().trim();
    }
    if (!targetEmail) {
      targetEmail = 'creator@novatech.io';
    }

    // Support both manager@novatech.io and brandmanager@novatech.io
    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { memberships: { include: { workspace: true } } },
    });

    if (!user && targetEmail === 'brandmanager@novatech.io') {
      user = await prisma.user.findUnique({
        where: { email: 'manager@novatech.io' },
        include: { memberships: { include: { workspace: true } } },
      });
    }

    if (!user) {
      res.status(404).json({ error: `Demo account for role ${role} not found. Please run seed.` });
      return;
    }

    const membership = user.memberships[0];
    const workspaceId = membership ? membership.workspaceId : '';
    const workspaceName = membership ? membership.workspace.name : 'NovaTech Global';

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId,
    });

    res.json({
      token,
      isDemoLogin: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        workspaceId,
        workspaceName,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo login failed.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: { include: { workspace: true } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const membership = user.memberships[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        workspaceId: membership?.workspaceId,
        workspaceName: membership?.workspace.name,
        notifications: user.notifications,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
};
