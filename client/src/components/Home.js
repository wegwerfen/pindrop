import React from 'react';
import { useSessionContext } from "supertokens-auth-react/recipe/session";
import { redirectToAuth } from "supertokens-auth-react";
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';

const Home = () => {
  const sessionContext = useSessionContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (sessionContext.doesSessionExist) {
      navigate('/hub');
    }
  }, [sessionContext.doesSessionExist, navigate]);

  const handleLogin = () => {
    if (sessionContext.loading) {
      return; // Wait for the session context to load
    }
    redirectToAuth({ show: "signin", redirectToPath: "/hub" });
  };

  const handleSignUp = () => {
    if (sessionContext.loading) {
      return; // Wait for the session context to load
    }
    redirectToAuth({ show: "signup", redirectToPath: "/hub" });
  };

  if (sessionContext.loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800">
        <div className="text-2xl font-bold text-blue-400">Pindrop</div>
        <div>
          <button onClick={handleLogin} className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300">Login</button>
          <button onClick={handleSignUp} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300">Sign Up</button>
        </div>
      </header>
      <main className="container mx-auto mt-16 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-blue-400">Pindrop: Your AI-Powered Personal Knowledge Hub</h1>
          <p className="text-xl mb-8 text-gray-300">
            Effortlessly organize and rediscover your digital life. Pindrop uses cutting-edge AI to summarize, tag, and enhance searches across your bookmarks, documents, notes, and images. Self-hostable for complete privacy and control.
          </p>
          <button onClick={handleSignUp} className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700 transition duration-300">Get Started</button>
        </div>
      </main>
    </div>
  );
};

export default Home;