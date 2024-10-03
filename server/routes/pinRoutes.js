import express from 'express';
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { createPin, uploadMiddleware, getPinDetails, updatePinNotes, deletePin, getPinTags, updatePinTags, getAllPins } from '../controllers/pinsController.js';

const router = express.Router();

// Apply middleware and routes in the correct order
router.post('/', verifySession(), uploadMiddleware, createPin);
router.get('/', verifySession(), getAllPins);
router.get('/:id', verifySession(), getPinDetails);
router.put('/:id/notes', verifySession(), updatePinNotes);
router.delete('/:id', verifySession(), deletePin);
router.get('/:id/tags', verifySession(), getPinTags);
router.put('/:id/tags', verifySession(), updatePinTags);

export default router;