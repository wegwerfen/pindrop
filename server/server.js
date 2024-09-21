import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';

import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session/index.js";
import EmailPassword from "supertokens-node/recipe/emailpassword/index.js";
import ThirdParty from "supertokens-node/recipe/thirdparty/index.js";
import { middleware, errorHandler } from "supertokens-node/framework/express/index.js";
import Dashboard from "supertokens-node/recipe/dashboard/index.js";
import UserRoles from "supertokens-node/recipe/userroles";

const app = express();
const PORT = process.env.PORT || 5000;

supertokens.init({
    framework: "express",
    supertokens: {
        connectionURI: "http://192.168.1.3:3567"
    },
    appInfo: {
        appName: "pindrop",
        apiDomain: "http://192.168.1.3:5000",
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
    ]
});

app.use(cors({
    origin: ["http://localhost:3000", "http://192.168.1.3:3000"], // Update this line
    allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
    credentials: true,
}));
app.use(express.json());

app.use(middleware());

app.use(errorHandler())

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});