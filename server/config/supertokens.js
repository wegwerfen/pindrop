import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword/index.js";
import ThirdParty from "supertokens-node/recipe/thirdparty/index.js";
import Dashboard from "supertokens-node/recipe/dashboard/index.js";
import UserRoles from "supertokens-node/recipe/userroles";
import UserMetadata from "supertokens-node/recipe/usermetadata";

export default function configureSupertokens() {
  supertokens.init({
    framework: "express",
    supertokens: {
      connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || "http://192.168.1.3:3567",
      // Remove the apiKey line if you're not using an API key for your self-hosted instance
    },
    appInfo: {
      appName: "pindrop",
      apiDomain: process.env.API_DOMAIN || "http://localhost:5000",
      websiteDomain: process.env.WEBSITE_DOMAIN || "http://localhost:3000",
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
      Session.init(),
      Dashboard.init(),
      UserMetadata.init(),
    ]
  });
}