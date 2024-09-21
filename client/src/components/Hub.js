import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, User } from 'lucide-react'; // Make sure you have lucide-react installed
import { signOut } from "supertokens-auth-react/recipe/session";

const Hub = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex justify-between items-center p-4 bg-gray-800">
        <div className="text-2xl font-bold text-blue-400">Pindrop</div>
        <div className="flex items-center">
          <Link to="/settings" className="mr-4 p-2 text-gray-300 hover:text-white">
            <Settings size={24} />
          </Link>
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 text-gray-300 hover:text-white focus:outline-none"
            >
              <User size={24} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto mt-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Welcome to Your Hub</h1>
        {/* Add your main content here */}
      </main>
    </div>
  );
};

export default Hub;