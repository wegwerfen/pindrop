import express from 'express';
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { getOrCreateUser, updateUser, changePassword } from '../controllers/authController.js';

const router = express.Router();

// Add '/api' prefix to all routes
router.get('/user', verifySession(), getOrCreateUser);
router.post('/user', verifySession(), updateUser);
router.post('/change-password', verifySession(), changePassword);

export default router;
