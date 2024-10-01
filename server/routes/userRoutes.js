import express from 'express';
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { getAllUsers, getOrCreateUser, updateUser, changePassword } from '../controllers/userController.js';

const router = express.Router();

// Add '/api' prefix to all routes
router.get('/', verifySession(), getOrCreateUser);
router.get('/users', verifySession(), getAllUsers);
router.post('/', verifySession(), updateUser);
router.post('/change-password', verifySession(), changePassword);

export default router;
