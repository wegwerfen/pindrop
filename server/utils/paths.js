// server/utils/paths.js
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = dirname(__filename);

// Base uploads directory (absolute path)
export const UPLOADS_DIR = path.resolve(__dirnamePath, '..', 'uploads');

// Specific directories
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');

// Export path generators
export const getUserImagesDir = (userId) => path.join(UPLOADS_DIR, userId.toString(), 'images');
export const getUserThumbnailsDir = (userId) => path.join(UPLOADS_DIR, userId.toString(), 'thumbnails');
export const getUserScreenshotsDir = (userId) => path.join(UPLOADS_DIR, userId.toString(), 'screenshots');

export const getUserImagePath = (userId, filename) => path.join(getUserImagesDir(userId), filename);
export const getUserThumbnailPath = (userId, filename) => path.join(getUserThumbnailsDir(userId), filename);
export const getUserScreenshotPath = (userId, filename) => path.join(getUserScreenshotsDir(userId), filename);

export const getTempDir = () => TEMP_DIR;

// Helper function to get the relative path from UPLOADS_DIR
export const getRelativePath = (fullPath) => path.relative(UPLOADS_DIR, fullPath);