import { Router, Request, Response } from 'express';
import { ForgeService } from '../services/forgeService.js';
import { config } from '../config/env.js';

const router = Router();
const forgeService = new ForgeService();

router.post('/auth', async (req: Request, res: Response) => {
  try {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      return res.status(400).json({ error: 'FORGE_CLIENT_ID/SECRET missing' });
    }

    const token = await forgeService['authenticate']();
    res.json({ token });
  } catch (error: any) {
    console.error('Forge auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', async (req: Request, res: Response) => {
  try {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      return res.status(400).json({ error: 'FORGE_CLIENT_ID/SECRET missing' });
    }

    const { fileBuffer, fileName } = req.body;

    if (!fileBuffer || !fileName) {
      return res.status(400).json({ error: 'fileBuffer and fileName are required' });
    }

    const buffer = Buffer.from(fileBuffer, 'base64');
    const result = await forgeService.uploadFile({
      fileBuffer: buffer.toString('base64'),
      fileName,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Forge upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/translate', async (req: Request, res: Response) => {
  try {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      return res.status(400).json({ error: 'FORGE_CLIENT_ID/SECRET missing' });
    }

    const { objectId, fileName } = req.body;

    if (!objectId || !fileName) {
      return res.status(400).json({ error: 'objectId and fileName are required' });
    }

    const result = await forgeService.translateFile(objectId, fileName);

    res.json(result);
  } catch (error: any) {
    console.error('Forge translate error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/manifest/:urn', async (req: Request, res: Response) => {
  try {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      return res.status(400).json({ error: 'FORGE_CLIENT_ID/SECRET missing' });
    }

    const { urn } = req.params;
    const result = await forgeService.getManifest(urn);

    res.json(result);
  } catch (error: any) {
    console.error('Forge manifest error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/properties/:urn', async (req: Request, res: Response) => {
  try {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      return res.status(400).json({ error: 'FORGE_CLIENT_ID/SECRET missing' });
    }

    const { urn } = req.params;
    const result = await forgeService.getProperties(urn);

    res.json(result);
  } catch (error: any) {
    console.error('Forge properties error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/takeoff/:urn', async (req: Request, res: Response) => {
  try {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      return res.status(400).json({ error: 'FORGE_CLIENT_ID/SECRET missing' });
    }

    const { urn } = req.params;
    const result = await forgeService.getTakeoff(urn);

    res.json(result);
  } catch (error: any) {
    console.error('Forge takeoff error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
