import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import createDOMPurify from 'dompurify';
import fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';
import models from '../models/index.js';
import { analyzeWebpage } from '../services/openaiService.js';
import { Op } from 'sequelize';

const { Pin, Webpage, Note, Image, Tags } = models;

puppeteer.use(StealthPlugin())

// Create a DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export const createPin = async (req, res) => {
  const { type, url } = req.body;
  const userId = req.session.getUserId();

  try {
    switch (type) {
      case 'webpage':
        // Move Puppeteer code to the beginning
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 718 });
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Create directories for user if they don't exist
        const userDir = path.join('uploads', userId.toString());
        const screenshotDir = path.join(userDir, 'screenshots');
        const thumbnailDir = path.join(userDir, 'thumbnails');
        if (!fs.existsSync(userDir)) await fsPromises.mkdir(userDir, { recursive: true });
        if (!fs.existsSync(screenshotDir)) await fsPromises.mkdir(screenshotDir, { recursive: true });
        if (!fs.existsSync(thumbnailDir)) await fsPromises.mkdir(thumbnailDir, { recursive: true });

        // Generate filenames
        const baseFilename = `${Date.now()}`;
        const fullScreenshotFilename = `${baseFilename}-full.webp`;
        const thumbnailFilename = `${baseFilename}-thumb.webp`;

        // Capture full page screenshot
        await page.screenshot({
          path: path.join(screenshotDir, fullScreenshotFilename),
          fullPage: true,
          type: 'webp',
        });

        // Capture viewport screenshot
        await page.screenshot({
          path: path.join(thumbnailDir, thumbnailFilename),
          fullPage: false,
          type: 'webp',
        });

        // Grab the page content
        const html = await page.content();

        // Close the browser
        await browser.close();

        // Process the HTML content through Readability
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document, {
          charThreshold: 0, // Lower the character threshold
          classesToPreserve: [], // Preserve all classes
        });
        let article = reader.parse();

        // Check if article is null or has no content
        if (!article || !article.content) {
          // Fallback to using the original HTML if Readability fails
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
        // clean HTML
        const cleanHtml = DOMPurify.sanitize(html);
        const cleanDom = new JSDOM(cleanHtml);
        const cleanDocument = cleanDom.window.document;

        // 1. Remove all <script> tags
        cleanDocument.querySelectorAll('script').forEach(el => el.remove());

        // 2. Add a class to all <a> tags
        cleanDocument.querySelectorAll('a').forEach(el => el.classList.add('external-link'));

        // 3. Wrap the content in a div with custom classes
        const wrapper = cleanDocument.createElement('div');
        wrapper.className = 'external-content bg-gray-950 shadow-lg rounded-lg';
        wrapper.innerHTML = cleanDocument.body.innerHTML;
        cleanDocument.body.innerHTML = '';
        cleanDocument.body.appendChild(wrapper);

        // Get the modified HTML
        const Html = cleanDom.serialize();

        // Analyze webpage content
        const analysis = await analyzeWebpage(article.textContent);

        // Create a new Pin
        const pin = await Pin.create({
          userId,
          type,
          title: article.title || url,
          thumbnail: thumbnailFilename, // Remove path.join here
        });

        console.log('Pin created:', pin.toJSON());

        // Handle tags
        if (analysis.tags && analysis.tags.length > 0) {
          const tagNames = analysis.tags.map(tag => tag.trim().toLowerCase());
          
          // Find existing tags or create new ones
          const tags = await Promise.all(tagNames.map(name => 
            Tags.findOrCreate({ where: { name } })
          ));

          // Associate tags with the pin
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
            excerpt: analysis.summary,
            byline: article.byline || '',
            siteName: article.siteName || '',
            url: url,
            lang: article.lang || '',
            screenshot: fullScreenshotFilename, // Remove path.join here
            classification: analysis.classification,
          };

          console.log('Attempting to create Webpage with data:', JSON.stringify(webpageData, null, 2));

          const webpage = await Webpage.create(webpageData);
          console.log('Webpage created:', webpage.toJSON());
        } catch (webpageError) {
          console.error('Error creating webpage:', webpageError);
          console.error('Error name:', webpageError.name);
          console.error('Error message:', webpageError.message);
          if (webpageError.errors) {
            console.error('Validation errors:', webpageError.errors);
          }
          throw webpageError;
        }

        res.status(201).json({ message: 'Webpage pin created successfully', pin });
        break;

      case 'image':
        // Handle image pin creation
        // ... implement image pin logic ...
        res.status(501).json({ message: 'Image pin creation not implemented yet' });
        break;

      case 'note':
        // Handle note pin creation
        // ... implement note pin logic ...
        res.status(501).json({ message: 'Note pin creation not implemented yet' });
        break;

      default:
        res.status(400).json({ error: 'Invalid pin type' });
        break;
    }
  } catch (error) {
    console.error('Error creating pin:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create pin: ' + error.message });
  }
};

export const updatePinNotes = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.session.getUserId();

  try {
    const pin = await Pin.findOne({
      where: { id, userId },
      include: [{ model: Webpage }],
    });

    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    if (pin.type !== 'webpage') {
      return res.status(400).json({ error: 'Notes can only be added to webpage pins' });
    }

    await pin.Webpage.update({ notes });

    res.status(200).json({ message: 'Notes updated successfully' });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ error: 'Failed to update notes' });
  }
};

export const getPinDetails = async (req, res) => {
  console.log('getPinDetails function called');
  const { id } = req.params;
  const userId = req.session.getUserId();

  console.log(`Fetching pin details for pinId: ${id}, userId: ${userId}`);

  try {
    const pin = await Pin.findOne({
      where: { id, userId },
      include: [{
        model: Webpage,
        attributes: ['url', 'content', 'textContent', 'cleanContent', 'excerpt', 'screenshot', 'notes', 'classification'],
      }],
    });

    console.log('Pin query result:', pin ? 'Pin found' : 'Pin not found');

    if (!pin) {
      console.log('Pin not found, sending 404 response');
      return res.status(404).json({ error: 'Pin not found' });
    }

    const pinData = pin.toJSON();

    // Add the webpage data to the pin object if it exists
    if (pin.Webpage) {
      pinData.url = pin.Webpage.url;
      pinData.content = pin.Webpage.content;
      pinData.textContent = pin.Webpage.textContent;
      pinData.cleanContent = pin.Webpage.cleanContent;
      pinData.excerpt = pin.Webpage.excerpt;
      pinData.screenshot = pin.Webpage.screenshot;
      pinData.notes = pin.Webpage.notes;
      pinData.classification = pin.Webpage.classification;
    }

    console.log('Pin data being sent:', JSON.stringify(pinData, null, 2));

    return res.json({ pin: pinData });
  } catch (error) {
    console.error('Error in getPinDetails:', error);
    return res.status(500).json({ error: 'Failed to fetch pin details' });
  }
};

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

    // 1. Delete associated data based on pin type
    switch (pin.type) {
      case 'webpage':
        if (pin.Webpage) {
          await pin.Webpage.destroy();
        }
        break;
      case 'note':
        if (pin.Note) {
          await pin.Note.destroy();
        }
        break;
      case 'image':
        if (pin.Image) {
          await pin.Image.destroy();
        }
        break;
      // Add more cases for other pin types if needed
    }

    // 2. Delete associated assets
    const userDir = path.join('uploads', userId.toString());
    const assetsToDelete = [
      pin.thumbnail ? path.join(userDir, 'thumbnails', pin.thumbnail) : null,
      pin.Webpage?.screenshot ? path.join(userDir, 'screenshots', pin.Webpage.screenshot) : null,
      // Add more asset paths if needed
    ].filter(Boolean);

    for (const assetPath of assetsToDelete) {
      try {
        await fs.unlink(assetPath);
      } catch (error) {
        console.error(`Failed to delete asset: ${assetPath}`, error);
        // Continue with deletion even if an asset fails to delete
      }
    }

    // 3. Delete the pin itself
    await pin.destroy();

    res.json({ message: "Pin and associated data deleted successfully" });
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add this new function to get tags for a pin
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

// Add this new function to update tags for a pin
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