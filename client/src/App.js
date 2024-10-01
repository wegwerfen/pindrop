import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import { ThirdPartyPreBuiltUI } from 'supertokens-auth-react/recipe/thirdparty/prebuiltui';
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui';
import { canHandleRoute, getRoutingComponent } from "supertokens-auth-react/ui";
import ThirdParty, { Github, Google } from "supertokens-auth-react/recipe/thirdparty";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";
import Home from './components/Home';
import Hub from './components/Hub';
import ProtectedRoute from './components/ProtectedRoute';

SuperTokens.init({
  appInfo: {
    appName: "pindrop",
    apiDomain: "http://localhost:5000",
    websiteDomain: "http://localhost:3000",
    apiBasePath: "/auth",
    websiteBasePath: "/auth"
  },
  recipeList: [
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [
          Github.init(),
          Google.init(),
        ]
      }
    }),
    EmailPassword.init(),
    Session.init()
  ]
});

// Add this custom hook
export const useAccessToken = () => {
  const [accessToken, setAccessToken] = React.useState(null);

  React.useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const token = await Session.getAccessToken();
        setAccessToken(token);
      } catch (error) {
        console.error("Error fetching access token:", error);
      }
    };

    fetchAccessToken();
  }, []);

  return accessToken;
};

function App() {
  if (canHandleRoute([ThirdPartyPreBuiltUI, EmailPasswordPreBuiltUI])) {
    // This renders the login UI on the /auth route
    return getRoutingComponent([ThirdPartyPreBuiltUI, EmailPasswordPreBuiltUI])
}
  return (
    <SuperTokensWrapper>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/hub" 
            element={
              <ProtectedRoute>
                <Hub />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </SuperTokensWrapper>
  );
}

export default App;
