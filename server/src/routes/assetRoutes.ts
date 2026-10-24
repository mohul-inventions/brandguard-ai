import { Router } from 'express';
import { listAssets, createAsset, updateAssetStatus, deleteAsset } from '../controllers/assetController';
import { requireAuth, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', requireAuth, listAssets);
router.post(
  '/',
  requireAuth,
  requireRole(['BRAND_MANAGER', 'ADMIN']),
  upload.single('assetFile'),
  createAsset
);
router.patch('/:id/status', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), updateAssetStatus);
router.delete('/:id', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), deleteAsset);

export default router;
