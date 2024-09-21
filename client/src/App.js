import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import ThirdParty, { Github, Google, Facebook, Apple } from "supertokens-auth-react/recipe/thirdparty";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";
import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import { ThirdPartyPreBuiltUI } from 'supertokens-auth-react/recipe/thirdparty/prebuiltui';
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui';
import * as reactRouterDom from "react-router-dom";
import Home from './components/Home'; // Add this import
import Hub from './components/Hub'; // Add this import
import ProtectedRoute from './components/ProtectedRoute'; // Add this import

SuperTokens.init({
  appInfo: {
    appName: "pindrop",
    apiDomain: "http://192.168.1.3:5000",
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
                  Facebook.init(),
                  Apple.init(),
              ]
          }
      }),
      EmailPassword.init(),
      Session.init()
  ]
});

const App = () => {
  return (
    <SuperTokensWrapper>
      <BrowserRouter>
        <Routes>
        {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [ThirdPartyPreBuiltUI, EmailPasswordPreBuiltUI])}
          <Route path="/" element={<Home />} />
          <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </SuperTokensWrapper>
  );
};

export default App;
