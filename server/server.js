import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword/index.js";
import ThirdParty from "supertokens-node/recipe/thirdparty/index.js";
import { middleware, errorHandler } from "supertokens-node/framework/express/index.js";
import Dashboard from "supertokens-node/recipe/dashboard/index.js";
import UserRoles from "supertokens-node/recipe/userroles";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import UserMetadata from "supertokens-node/recipe/usermetadata";
import models, { sequelize } from './models/index.js';
import { createPin, updatePinNotes, getPinDetails, deletePin, getPinTags, updatePinTags } from './controllers/pinsController.js';

// If you need to use specific models, destructure them here:
const { User, Pin, Webpage } = models;  // Add or remove models as needed

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: "http://192.168.1.3:3567"
    },
    appInfo: {
        appName: "pindrop",
        apiDomain: "http://localhost:5000",
        websiteDomain: "http://localhost:3000", // Change this line
        apiBasePath: "/auth",
        websiteBasePath: "/auth"
    },
    recipeList: [
        UserRoles.init(),
        EmailPassword.init(),
        ThirdParty.init({
            signInAndUpFeature: {
                providers: [{
                    config: {
                        thirdPartyId: "google",
                        clients: [{
                            clientId: "1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com",
                            clientSecret: "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"
                        }]
                    }
                }, {
                    config: {
                        thirdPartyId: "github",
                        clients: [{
                            clientId: "467101b197249757c71f",
                            clientSecret: "e97051221f4b6426e8fe8d51486396703012f5bd"
                        }]
                    }
                }],
            }
        }),
        Session.init(), // initializes session features
        Dashboard.init(),
        UserMetadata.init(),
    ]
});

// Serve static files from the uploads directory
app.use('/uploads', (req, res, next) => {
    // Remove the duplicate 'thumbnails' from the path
    const adjustedUrl = req.url.replace('/thumbnails/thumbnails/', '/thumbnails/');
    const filePath = path.join(__dirname, 'uploads', adjustedUrl);
    console.log('Requested file:', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            next();
        }
    });
}, express.static(path.join(__dirname, 'uploads')));

app.use(cors({
    origin: ["http://localhost:3000", "http://192.168.1.3:3000"], // Update this line
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
}));
app.use(express.json());

app.use(middleware());

// Updated endpoint to get or create user
app.get('/api/user', verifySession(), async (req, res) => {
    console.log('Session verified, user ID:', req.session.getUserId());
    console.log('Request headers:', req.headers);
    try {
        const userId = req.session.getUserId();
        const tenantId = "public"; // Use the appropriate tenant ID here

        // Get user metadata from SuperTokens
        const { metadata } = await UserMetadata.getUserMetadata(userId);
        console.log('User metadata from SuperTokens:', metadata);

        // Get user roles
        const { roles } = await UserRoles.getRolesForUser(tenantId, userId);
        console.log('User roles:', roles);

        // Check if user has 'Admin' role
        const isAdmin = roles.includes('Admin');

        // Fetch user info from SuperTokens (moved outside of if block)
        const userInfo = await supertokens.getUser(userId);
        if (!userInfo) {
            return res.status(404).json({ error: "User not found in SuperTokens" });
        }
        console.log('User info from SuperTokens:', userInfo);
        console.log('User info from SuperTokens:', userInfo.loginMethods[0]);
        // Get the verified state from the login method
        const verified = userInfo.loginMethods[0]?.verified || false;

        // Get user info from your database
        let user = await User.findOne({ where: { userId: userId } });

        if (!user) {
            console.log('User not found in database, creating new user');

            // Create user in Pindrop database
            try {
                user = await User.create({
                    userId: userId,
                    email: userInfo.emails[0] || 'noemail@example.com',
                    verified: verified ? 1 : 0,
                    metadata: JSON.stringify(metadata),
                    firstName: metadata.first_name || null,
                    lastName: metadata.last_name || null,
                    isAdmin: isAdmin ? 1 : 0, // Set isAdmin based on role check
                    thirdParty: userInfo.loginMethods[0]?.thirdParty?.id || null,
                    // Add any other fields you want to store
                });
            } catch (createError) {
                console.error('Error creating user:', createError);
                return res.status(500).json({ error: "Failed to create user in database" });
            }
        } else {
            // If user exists, update metadata, name fields, and isAdmin status
            user.metadata = JSON.stringify(metadata);
            if (metadata.first_name !== undefined) {
                user.firstName = metadata.first_name;
            }
            if (metadata.last_name !== undefined) {
                user.lastName = metadata.last_name;
            }
            user.isAdmin = isAdmin ? 1 : 0; // Update isAdmin based on role check
            user.verified = verified ? 1 : 0; // Update verified status
            user.thirdParty = userInfo.loginMethods[0]?.thirdParty?.id || null;
            await user.save();
        }

        res.json({ user: user.toJSON() });
    } catch (error) {
        console.error('Error in /api/user:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update this endpoint
app.post('/api/user', verifySession(), async (req, res) => {
    try {
        const userId = req.session.getUserId();
        const { firstName, lastName } = req.body;
        console.log('Received update request for user:', userId);
        console.log('Update data:', { firstName, lastName });

        // Update user metadata in SuperTokens
        await UserMetadata.updateUserMetadata(userId, {
            first_name: firstName,
            last_name: lastName
        });
        console.log('SuperTokens metadata updated');

        // Update user in Pindrop database
        const user = await User.findOne({ where: { userId: userId } });
        if (!user) {
            console.log('User not found in Pindrop database');
            return res.status(404).json({ error: "User not found" });
        }

        user.firstname = firstName;  // Changed from firstName to firstname
        user.lastname = lastName;    // Changed from lastName to lastname
        await user.save();
        console.log('User updated in Pindrop database');

        res.json({ message: "User information updated successfully", user: user.toJSON() });
    } catch (error) {
        console.error('Error in /api/user:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add this new endpoint
app.post('/api/change-password', verifySession(), async (req, res) => {
    try {
        const session = req.session;
        const { oldPassword, newPassword } = req.body;

        const userInfo = await supertokens.getUser(session.getUserId());

        if (!userInfo) {
            return res.status(404).json({ error: "User not found" });
        }

        const loginMethod = userInfo.loginMethods.find(
            (lM) => lM.recipeUserId.getAsString() === session.getRecipeUserId().getAsString() && lM.recipeId === "emailpassword"
        );

        if (!loginMethod) {
            return res.status(400).json({ error: "User is not using email/password login" });
        }

        const email = loginMethod.email;

        // Verify old password
        const isPasswordValid = await EmailPassword.verifyCredentials(session.getTenantId(), email, oldPassword);

        if (isPasswordValid.status !== "OK") {
            return res.status(400).json({ error: "Incorrect old password" });
        }

        // Update password
        const response = await EmailPassword.updateEmailOrPassword({
            recipeUserId: session.getRecipeUserId(),
            password: newPassword,
            tenantIdForPasswordPolicy: session.getTenantId()
        });

        if (response.status === "PASSWORD_POLICY_VIOLATED_ERROR") {
            return res.status(400).json({ error: "New password does not meet policy requirements" });
        }

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error('Error in /api/change-password:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update this endpoint to use the controller
app.post('/api/pins', verifySession(), createPin);

// Add this new endpoint
app.get('/api/pins', verifySession(), async (req, res) => {
  try {
    const userId = req.session.getUserId();
    const pins = await Pin.findAll({
      where: { userId },
      order: [['created', 'DESC']],
      attributes: ['id', 'userId', 'type', 'title', 'thumbnail', 'created'],
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
});

// Add this new endpoint
app.get('/api/pins/:id', verifySession(), async (req, res) => {
  console.log('GET /api/pins/:id route hit');
  await getPinDetails(req, res);
});

app.put('/api/pins/:id/notes', verifySession(), updatePinNotes);

// Update this endpoint
app.delete('/api/pins/:id', verifySession(), deletePin);

// Add these new routes
app.get('/api/pins/:id/tags', verifySession(), getPinTags);
app.put('/api/pins/:id/tags', verifySession(), updatePinTags);

app.use(errorHandler())

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

sequelize.sync({ alter: false }).then(() => {
  console.log('Database & tables created!');
}).catch((error) => {
  console.error('Error syncing database:', error);
});

// ... rest of your server setup