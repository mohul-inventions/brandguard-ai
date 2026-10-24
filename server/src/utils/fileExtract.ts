import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedContent {
  text: string;
  wordCount: number;
  format: string;
  metadata?: Record<string, any>;
}

export const extractFileText = async (filePath: string, originalName: string): Promise<ExtractedContent> => {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.txt' || ext === '.md' || ext === '.markdown') {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return {
      text: raw.trim(),
      wordCount: raw.split(/\s+/).filter(Boolean).length,
      format: ext.replace('.', ''),
    };
  }

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return {
      text: pdfData.text.trim(),
      wordCount: pdfData.text.split(/\s+/).filter(Boolean).length,
      format: 'pdf',
      metadata: {
        numpages: pdfData.numpages,
        info: pdfData.info,
      },
    };
  }

  if (ext === '.docx' || ext === '.doc') {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
      text: result.value.trim(),
      wordCount: result.value.split(/\s+/).filter(Boolean).length,
      format: 'docx',
      metadata: {
        warnings: result.messages,
      },
    };
  }

  // If image file
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
    const stats = fs.statSync(filePath);
    return {
      text: `[Visual Asset: ${originalName} (${Math.round(stats.size / 1024)} KB)]`,
      wordCount: 0,
      format: ext.replace('.', ''),
      metadata: {
        sizeBytes: stats.size,
        filename: path.basename(filePath),
      },
    };
  }

  throw new Error(`Unsupported document extension: ${ext}`);
};
