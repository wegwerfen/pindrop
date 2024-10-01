import express from 'express';
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { createPin, getPinDetails, updatePinNotes, deletePin, getPinTags, updatePinTags, getAllPins } from '../controllers/pinsController.js';

const router = express.Router();

// Add '/api' prefix to all routes
router.post('/', verifySession(), createPin);
router.get('/', verifySession(), getAllPins);
router.get('/:id', verifySession(), getPinDetails);
router.put('/:id/notes', verifySession(), updatePinNotes);
router.delete('/:id', verifySession(), deletePin);
router.get('/:id/tags', verifySession(), getPinTags);
router.put('/:id/tags', verifySession(), updatePinTags);

export default router;
