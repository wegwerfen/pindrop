import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import createDOMPurify from 'dompurify';
import fs from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import models from '../models/index.js';
import { analyzeWebpage, analyzeImage, analyzeNote } from '../services/openaiService.js';
import { Op } from 'sequelize';
import sharp from 'sharp';
import multer from 'multer';
import bodyParser from 'body-parser';
import {
  getTempDir,
  getUserImagesDir,
  getUserThumbnailsDir,
  getUserImagePath,
  getUserThumbnailPath,
  getUserScreenshotPath,
  UPLOADS_DIR,
  getUserScreenshotsDir
} from '../utils/paths.js';
import { promisify } from 'util';
import { rm } from 'fs/promises';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filename);

const { Pin, Webpage, Note, Image, Tags } = models;

puppeteer.use(StealthPlugin());

// Create a DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Configure multer storage to use the temp directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getTempDir());
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware to handle file uploads
export const uploadMiddleware = (req, res, next) => {
  const contentType = req.headers['content-type'];
  console.log('uploadMiddleware - Content-Type:', contentType);

  if (contentType && contentType.startsWith('multipart/form-data')) {
    upload.any()(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: `Multer error: ${err.message}` });
      } else if (err) {
        console.error('Unknown error:', err);
        return res.status(500).json({ error: `Unknown error: ${err.message}` });
      }
      console.log('After multer middleware - req.files:', req.files);
      console.log('After multer middleware - req.body:', JSON.stringify(req.body, null, 2));
      next();
    });
  } else {
    bodyParser.json()(req, res, (err) => {
      if (err) {
        console.error('Body parser error:', err);
        return res.status(400).json({ error: `Body parser error: ${err.message}` });
      }
      console.log('After body parser middleware - req.body:', JSON.stringify(req.body, null, 2));
      next();
    });
  }
};

// Function to handle image uploads from files
const handleImageUpload = async (userId, filename, filePath) => {
  const userThumbnailsDir = getUserThumbnailsDir(userId);
  await fs.mkdir(userThumbnailsDir, { recursive: true });

  let imageSharp;
  try {
    // Read the image into a buffer
    const buffer = await fs.readFile(filePath);

    // Create thumbnail using the buffer
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = getUserThumbnailPath(userId, thumbnailFilename);

    imageSharp = sharp(buffer);
    await imageSharp
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(thumbnailPath);

    const metadata = await imageSharp.metadata();

    // Create a new Pin
    const pin = await Pin.create({
      userId,
      type: 'image',
      title: filename,
      thumbnail: thumbnailFilename,
    });

    // Analyze the image using the buffer
    const analysis = await analyzeImage(buffer, userId);
console.log('Analysis:', analysis);
    // Handle tags
    if (analysis.tags && analysis.tags.length > 0) {
      const tagNames = analysis.tags.map(tag => tag.trim().toLowerCase());
      const tags = await Promise.all(tagNames.map(name => 
        Tags.findOrCreate({ where: { name } })
      ));
      await pin.setTags(tags.map(tag => tag[0]));
    }

    await Image.create({
      pinId: pin.id,
      filePath: path.relative(UPLOADS_DIR, filePath),
      width: metadata.width,
      height: metadata.height,
      type: metadata.format,
      summary: analysis.summary || analysis.description, // New field
    });

    // Ensure consistent permissions
    await fs.chmod(filePath, 0o644);
    await fs.chmod(thumbnailPath, 0o644);

    return pin;
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    throw new Error('Failed to process uploaded image');
  } finally {
    if (imageSharp) {
      imageSharp.destroy();
    }
  }
};

// Function to handle image uploads via URL
export const handleImageUrl = async (userId, imageUrl) => {
  try {
    console.log('Fetching image from URL:', imageUrl);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const buffer = await response.buffer();

    const filename = `${Date.now()}-${path.basename(imageUrl).split('?')[0]}`; // Remove query params if any
    const filePath = getUserImagePath(userId, filename);

    console.log('Creating directory:', path.dirname(filePath));
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    console.log('Saving image to:', filePath);
    await fs.writeFile(filePath, buffer);

    console.log('Getting image metadata');
    const metadata = await sharp(buffer).metadata();

    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = getUserThumbnailPath(userId, thumbnailFilename);
    console.log('Creating thumbnail:', thumbnailPath);
    await sharp(buffer)
      .resize(200, 200, { fit: 'inside' })
      .toFile(thumbnailPath);

    console.log('Creating pin record');
    const pin = await Pin.create({
      userId,
      type: 'image',
      title: path.basename(imageUrl),
      thumbnail: thumbnailFilename,
    });

    console.log('Analyzing image');
    // **Pass the buffer instead of the filePath**
    const analysis = await analyzeImage(buffer, userId);
    console.log('Analysis:', analysis);
    
    console.log('Creating image record');
    await Image.create({
      pinId: pin.id,
      filePath: path.join(userId.toString(), 'images', filename), // Store relative path
      width: metadata.width,
      height: metadata.height,
      type: metadata.format,
      summary: analysis.summary || analysis.description, // New field
    });

    console.log('Handling tags');
    if (analysis.tags && analysis.tags.length > 0) {
      const tagNames = analysis.tags.map(tag => tag.trim().toLowerCase());
      const tags = await Promise.all(tagNames.map(name => 
        Tags.findOrCreate({ where: { name } })
      ));
      await pin.setTags(tags.map(tag => tag[0]));
    }

    return pin;
  } catch (error) {
    console.error('Error processing image URL:', error);
    throw new Error(`Failed to process image URL: ${error.message}`);
  }
};

// Existing function: createPin
export const createPin = async (req, res) => {
  console.log('createPin - req.body:', JSON.stringify(req.body, null, 2));
  console.log('createPin - req.files:', req.files);
  console.log('createPin - Content-Type:', req.headers['content-type']);

  let type = req.body.type;
  let url = req.body.url;
  const userId = req.session.getUserId();

  console.log('Type:', type);
  console.log('URL:', url);
  console.log('UserId:', userId);

  if (!type) {
    return res.status(400).json({ error: 'Invalid request: No type provided' });
  }

  try {
    let pin;
    if (type === 'image') {
      if (req.files && req.files.length > 0) {
        // Handle local file upload
        const file = req.files[0];
        const tempPath = file.path;
        const filename = file.originalname;
        
        // Move file from temp to user's directory
        const userImagesDir = getUserImagesDir(userId);
        await fs.mkdir(userImagesDir, { recursive: true });
        const newFilename = `${Date.now()}-${filename}`;
        const newFilePath = getUserImagePath(userId, newFilename);
        await fs.rename(tempPath, newFilePath);
        
        pin = await handleImageUpload(userId, newFilename, newFilePath);
      } else if (url) {
        // Handle image URL
        pin = await handleImageUrl(userId, url);
      } else {
        return res.status(400).json({ error: 'No image file or URL provided' });
      }
    } else if (type === 'webpage') {
      if (!url) {
        return res.status(400).json({ error: 'No URL provided for webpage' });
      }

      // Create a skeleton pin
      const skeletonTitle = 'Loading...';
      pin = await Pin.create({
        userId,
        type,
        classification: type, // Set classification same as type initially
        title: skeletonTitle,
      });

      // Get the last inserted ID
      const [result] = await Pin.sequelize.query('SELECT LAST_INSERT_ID() as id');
      const pinId = result[0].id;

      // Existing webpage handling code
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 718 });
      await page.goto(url, { waitUntil: 'networkidle2' });

      // Create directories for user if they don't exist
      const screenshotDir = getUserScreenshotsDir(userId);
      const thumbnailDir = getUserThumbnailsDir(userId);
      await fs.mkdir(screenshotDir, { recursive: true });
      await fs.mkdir(thumbnailDir, { recursive: true });

      // Generate filenames using pinId
      const baseFilename = `${pinId}`;
      const fullScreenshotFilename = `${baseFilename}-full.webp`;
      const thumbnailFilename = `${baseFilename}-thumb.webp`;

      // Capture full page screenshot
      await page.screenshot({
        path: getUserScreenshotPath(userId, fullScreenshotFilename),
        fullPage: true,
        type: 'webp',
        quality: 80 // Adjust quality as needed
      });

      // Capture viewport screenshot for thumbnail
      await page.screenshot({
        path: getUserThumbnailPath(userId, thumbnailFilename),
        fullPage: false,
        type: 'webp',
        quality: 80 // Adjust quality as needed
      });

      // Grab the page content
      const html = await page.content();

      // Close the browser
      await browser.close();

      // Process the HTML content through Readability
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document, {
        charThreshold: 0,
        classesToPreserve: [],
      });
      let article = reader.parse();

      // Check if article is null or has no content
      if (!article || !article.content) {
        article = {
          content: html,
          title: dom.window.document.title || url,
          textContent: dom.window.document.body.textContent || '',
          length: html.length,
          excerpt: dom.window.document.body.textContent.slice(0, 200) || '',
          byline: '',
          siteName: '',
          lang: dom.window.document.documentElement.lang || '',
        };
      }

      // Clean HTML
      const cleanHtml = DOMPurify.sanitize(html);
      const cleanDom = new JSDOM(cleanHtml);
      const cleanDocument = cleanDom.window.document;

      // Remove scripts, modify links, wrap content
      cleanDocument.querySelectorAll('script').forEach(el => el.remove());
      cleanDocument.querySelectorAll('a').forEach(el => el.classList.add('external-link'));
      const wrapper = cleanDocument.createElement('div');
      wrapper.className = 'external-content bg-gray-950 shadow-lg rounded-lg';
      wrapper.innerHTML = cleanDocument.body.innerHTML;
      cleanDocument.body.innerHTML = '';
      cleanDocument.body.appendChild(wrapper);

      const Html = cleanDom.serialize();

      // Analyze webpage content
      const analysis = await analyzeWebpage(article.textContent);

      // Update the existing Pin with additional fields
      await pin.update({
        title: article.title || url,
        thumbnail: thumbnailFilename,
        classification: analysis.classification, // Update classification based on analysis
      });

      // Handle tags
      if (analysis.tags && analysis.tags.length > 0) {
        const tagNames = analysis.tags.map(tag => tag.trim().toLowerCase());
        const tags = await Promise.all(tagNames.map(name => 
          Tags.findOrCreate({ where: { name } })
        ));
        await pin.setTags(tags.map(tag => tag[0]));
      }

      // Create a new Webpage associated with the Pin
      try {
        const webpageData = {
          pinId: pin.id,
          content: article.content || '',
          textContent: article.textContent || '',
          cleanContent: Html,
          length: article.length || 0,
          summary: analysis.summary,
          comments: analysis.comments || '', // Updated field
          byline: article.byline || '',
          siteName: article.siteName || '',
          url: url,
          lang: article.lang || '',
          screenshot: fullScreenshotFilename,
          classification: analysis.classification,
        };

        await Webpage.create(webpageData);
      } catch (webpageError) {
        console.error('Error creating webpage:', webpageError);
        throw webpageError;
      }
    } else if (type === 'note') {
      pin = await Pin.create({
        userId,
        type: 'note',
        classification: 'note',
        title: 'New Note',
      });

      await Note.create({
        pinId: pin.id,
        content: '',
        summary: '',
      });
    } else {
      return res.status(400).json({ error: 'Invalid pin type' });
    }

    res.status(201).json({ pin });
  } catch (error) {
    console.error('Error creating pin:', error);
    res.status(500).json({ error: 'Failed to create pin: ' + error.message });
  }
};

export const updatePinNote = async (req, res) => {
  const { id } = req.params;
  const pinId = parseInt(id, 10);
  const { content, title, summary, tags } = req.body;
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({
      where: { id: pinId, userId },
      include: [{ model: Note }, { model: Tags }],
    });
    console.log('Pin found:', pin);
    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    if (pin.type !== 'note') {
      return res.status(400).json({ error: 'This pin is not a note' });
    }

    // Analyze the note content
    const analysis = await analyzeNote(content);
    console.log('Note analysis:', analysis);

    // Update or create the Note
    const [note, created] = await Note.findOrCreate({
      where: { pinId: pin.id },
      defaults: { 
        content, 
        summary: analysis.summary || summary 
      }
    });

    if (!created) {
      await note.update({ 
        content, 
        summary: analysis.summary || summary 
      });
    }

    // Update the Pin's title
    await pin.update({
      title: analysis.title || title
    });

    console.log(created ? 'New note created' : 'Existing note updated');

    // Handle tags
    if (analysis.tags && analysis.tags.length > 0) {
      const tagNames = analysis.tags.map(tag => tag.trim().toLowerCase());
      const tags = await Promise.all(tagNames.map(name => 
        Tags.findOrCreate({ where: { name } })
      ));
      await pin.setTags(tags.map(tag => tag[0]));
    }

    // Fetch the updated pin with its associations
    const updatedPin = await Pin.findOne({
      where: { id: pinId, userId },
      include: [
        { model: Note },
        { model: Tags, through: { attributes: [] }, attributes: ['name'] }
      ],
    });

    res.status(200).json({ 
      message: 'Note updated successfully',
      pin: {
        id: updatedPin.id,
        title: updatedPin.title,
        type: updatedPin.type,
        content: updatedPin.Note.content, // Return just the content
        summary: updatedPin.Note.summary,
        tags: updatedPin.Tags.map(tag => tag.name),
      }
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
};

export const updatePinComments = async (req, res) => {
  const { id } = req.params;
  const pinId = parseInt(id, 10); // Ensure pinId is a number
  const { comments } = req.body;   // Renamed from 'notes' to 'comments'
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({
      where: { id: pinId, userId },
      include: [
        { model: Webpage },
        { model: Image },
        { model: Note },
        { model: Tags },
      ],
    });

    console.log('Pin found:', pin);

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    // Update comments based on pin type
    switch (pin.type) {
      case 'webpage':
        if (pin.Webpage) {
          await pin.Webpage.update({ comments });
          console.log('Webpage comments updated');
        } else {
          return res.status(400).json({ error: 'Webpage data not found for this pin' });
        }
        break;

      case 'image':
        if (pin.Images && pin.Images.length > 0) {
          // Assuming you want to update comments for all associated images
          await Promise.all(pin.Images.map(image => image.update({ comments })));
          console.log('Image comments updated');
        } else {
          return res.status(400).json({ error: 'No images found for this pin' });
        }
        break;

      case 'note':
        if (pin.Note) {
          await pin.Note.update({ comments });
          console.log('Note comments updated');
        } else {
          return res.status(400).json({ error: 'Note data not found for this pin' });
        }
        break;

      default:
        return res.status(400).json({ error: 'Unsupported pin type' });
    }

    // Optionally, handle tags if needed
    // const { tags } = req.body;
    // if (tags && tags.length > 0) {
    //   const tagNames = tags.map(tag => tag.trim().toLowerCase());
    //   const tagsInstances = await Promise.all(tagNames.map(name => 
    //     Tags.findOrCreate({ where: { name } })
    //   ));
    //   await pin.setTags(tagsInstances.map(tag => tag[0]));
    // }

    // Fetch the updated pin with its associations
    const updatedPin = await Pin.findOne({
      where: { id: pinId, userId },
      include: [
        { model: Webpage },
        { model: Image },
        { model: Note },
        { model: Tags, through: { attributes: [] }, attributes: ['name'] },
      ],
    });

    res.status(200).json({ 
      message: 'Comments updated successfully',
      pin: {
        ...updatedPin.toJSON(),
        tags: updatedPin.Tags.map(tag => tag.name),
        // Include comments based on pin type
        comments: pin.type === 'webpage' ? updatedPin.Webpage.comments :
                  pin.type === 'image' ? updatedPin.Images.map(img => img.comments) :
                  pin.type === 'note' ? updatedPin.Note.comments :
                  null,
      }
    });
  } catch (error) {
    console.error('Error updating comments:', error);
    res.status(500).json({ error: 'Failed to update comments' });
  }
};

export const getPinDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({
      where: { id, userId },
      include: [
        {
          model: Webpage,
          attributes: { exclude: ['id'] },
        },
        {
          model: Image,
          attributes: ['filePath', 'width', 'height', 'type', 'summary', 'comments'], // Include 'comments'
        },
        {
          model: Note,
          attributes: ['content', 'summary', 'comments'], // Include 'comments'
        },
        {
          model: Tags,
          through: { attributes: [] },
          attributes: ['name'],
        },
      ],
      attributes: { include: ['classification'] }, // Include classification in the query
    });

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    const pinData = pin.toJSON();

    // Flatten the image data if it exists
    if (pin.type === 'image' && pinData.Images && pinData.Images.length > 0) {
      pinData.image = pinData.Images[0];
      delete pinData.Images;
    }

    // Include tags
    pinData.tags = pinData.Tags.map(tag => tag.name);
    delete pinData.Tags;

    console.log('Sending pin data:', pinData);

    return res.json({ pin: pinData });
  } catch (error) {
    console.error('Error in getPinDetails:', error);
    return res.status(500).json({ error: 'Failed to fetch pin details' });
  }
};

// Keep track of open file handles
const openHandles = new Map();

// Function to safely open a file and track its handle
async function safeOpenFile(filePath) {
  const handle = await fs.open(filePath, 'r');
  openHandles.set(filePath, handle);
  return handle;
}

// Function to safely close a file handle
async function safeCloseFile(filePath) {
  const handle = openHandles.get(filePath);
  if (handle) {
    await handle.close();
    openHandles.delete(filePath);
    console.log(`Closed file handle for: ${filePath}`);
  }
}

// Modified function to create a read stream
function createSafeReadStream(filePath) {
  const stream = createReadStream(filePath);
  stream.on('close', () => safeCloseFile(filePath));
  return stream;
}

async function deleteFileWithRetry(filePath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await safeCloseFile(filePath);
      await fs.unlink(filePath);
      console.log(`Successfully deleted file: ${filePath}`);
      return;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed to delete file: ${filePath}`, error);
      if (i < retries - 1) {
        console.log(`Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  console.error(`Failed to delete file after ${retries} attempts: ${filePath}`);
}

export const deletePin = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({
      where: { id, userId },
      include: [{ model: Webpage }, { model: Note }, { model: Image }],
    });

    if (!pin) {
      return res.status(404).json({ error: "Pin not found" });
    }

    console.log('Deleting pin:', JSON.stringify(pin, null, 2));

    switch (pin.type) {
      case 'image':
        if (pin.Images && pin.Images.length > 0) {
          const image = pin.Images[0];
          const imagePath = path.join(UPLOADS_DIR, image.filePath);
          const thumbnailPath = getUserThumbnailPath(userId, pin.thumbnail);

          console.log('Attempting to delete image:', imagePath);
          await fs.unlink(imagePath);

          console.log('Attempting to delete thumbnail:', thumbnailPath);
          await fs.unlink(thumbnailPath);

          await image.destroy();
        }
        break;
      case 'webpage':
        if (pin.Webpage && pin.Webpage.screenshot) {
          const screenshotPath = getUserScreenshotPath(userId, pin.Webpage.screenshot);
          console.log('Attempting to delete screenshot:', screenshotPath);
          await fs.unlink(screenshotPath);
        }
        if (pin.thumbnail) {
          const thumbnailPath = getUserThumbnailPath(userId, pin.thumbnail);
          console.log('Attempting to delete thumbnail:', thumbnailPath);
          await fs.unlink(thumbnailPath);
        }
        if (pin.Webpage) {
          await pin.Webpage.destroy();
        }
        break;
    }

    await pin.destroy();

    res.json({ message: "Pin and associated data deleted successfully" });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cleanup routine
async function cleanupOpenHandles() {
  console.log('Running cleanup routine...');
  for (const [filePath, handle] of openHandles.entries()) {
    try {
      await handle.close();
      openHandles.delete(filePath);
      console.log(`Closed lingering handle for: ${filePath}`);
      await fs.unlink(filePath);
      console.log(`Deleted file during cleanup: ${filePath}`);
    } catch (error) {
      console.error(`Error during cleanup for ${filePath}:`, error);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOpenHandles, 5 * 60 * 1000);

// Function to get pin tags - example (ensure this remains unchanged)
export const getPinTags = async (req, res) => {
  const { id } = req.params;
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({
      where: { id, userId },
      include: [{ model: Tags, through: { attributes: [] } }],
    });

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    res.json({ tags: pin.Tags });
  } catch (error) {
    console.error('Error fetching pin tags:', error);
    res.status(500).json({ error: 'Failed to fetch pin tags' });
  }
};

// Function to update pin tags - example (ensure this remains unchanged)
export const updatePinTags = async (req, res) => {
  const { id } = req.params;
  const { tags } = req.body;
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({ where: { id, userId } });

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    // Find or create tags
    const tagInstances = await Promise.all(tags.map(name => 
      Tags.findOrCreate({ where: { name: name.trim().toLowerCase() } })
    ));

    // Set the new tags for the pin
    await pin.setTags(tagInstances.map(tag => tag[0]));

    res.json({ message: 'Tags updated successfully' });
  } catch (error) {
    console.error('Error updating pin tags:', error);
    res.status(500).json({ error: 'Failed to update pin tags' });
  }
};

// Function to get all pins - example (ensure this remains unchanged)
export const getAllPins = async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const pins = await Pin.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'userId', 'type', 'classification', 'title', 'thumbnail', 'createdAt'],
      include: [{
        model: Webpage,
        attributes: ['url'],
      }],
    });

    // Correct the thumbnail paths and include URL
    const correctedPins = pins.map(pin => ({
      ...pin.toJSON(),
      thumbnail: pin.thumbnail ? `${pin.thumbnail}` : null,
      url: pin.Webpage ? pin.Webpage.url : null,
    }));

    res.json({ pins: correctedPins });
  } catch (error) {
    console.error('Error fetching pins:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};