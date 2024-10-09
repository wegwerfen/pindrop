import express from 'express';
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { 
  createPin, 
  getPinDetails, 
  updatePinComments, 
  getPinTags, 
  updatePinTags, 
  getAllPins, 
  deletePin, 
  updatePinNote 
} from '../controllers/pinsController.js';
import { uploadMiddleware } from '../controllers/pinsController.js';

const router = express.Router();

// Apply middleware and routes in the correct order
router.post('/', verifySession(), uploadMiddleware, createPin);
router.get('/', verifySession(), getAllPins);
router.get('/:id', verifySession(), getPinDetails);
router.put('/:id/comments', verifySession(), updatePinComments);
router.delete('/:id', verifySession(), deletePin);
router.get('/:id/tags', verifySession(), getPinTags);
router.put('/:id/tags', verifySession(), updatePinTags);
router.put('/:id/note', verifySession(), updatePinNote);


export default router;