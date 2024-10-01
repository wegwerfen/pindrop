import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, useSessionContext } from "supertokens-auth-react/recipe/session";
import { SessionAuth } from "supertokens-auth-react/recipe/session";
import Toolbar from './Toolbar';
import UserSettingsModal from './UserSettingsModal';
import axios from '../axiosConfig';
import Card from './Card';
import Page from './Page';

axios.defaults.baseURL = 'http://localhost:5000';

const Hub = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState(null);
  const session = useSessionContext();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true);
    setDropdownOpen(false);
  };

  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const handleSaveUserSettings = async (updatedUserData) => {
    try {
      const response = await axios.post('/api/user', updatedUserData);
      
      setUser(prevUser => ({
        ...prevUser,
        firstname: response.data.user.firstname,
        lastname: response.data.user.lastname
      }));
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (session.doesSessionExist) {
          const response = await axios.get('/api/user');
          setUser(response.data.user);
        } else {
          console.warn('Session does not exist');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
          
          if (error.response.status === 404) {
            // User not found, redirect to create user
            try {
              const email = await session.getUserId(); // This might need to be adjusted based on how you store the email
              await axios.post('/api/create-user', { email });
              // Retry fetching user data
              const response = await axios.get('/api/user');
              setUser(response.data.user);
            } catch (createError) {
              console.error('Error creating user:', createError);
              // Handle create user error (e.g., redirect to error page or show error message)
            }
          } else if (error.response.status === 401) {
            // Unauthorized, redirect to login page
            window.location.href = '/auth';
          }
        }
      }
    };

    fetchUserData();
  }, [session]);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/pins');
        console.log('Fetched pins:', response.data.pins);
        setPins(response.data.pins);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pins:', error.response?.data || error.message);
        setError('Failed to fetch pins. Please try again later.');
        setLoading(false);
      }
    };

    if (user) {
      fetchPins();
    }
  }, [user]);

  const handleOpenPage = (pin) => {
    setSelectedPin(pin.id);
  };

  const handleClosePage = () => {
    setSelectedPin(null);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedPin) {
        handleClosePage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPin]);

  return (
    <SessionAuth>
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        <header className="flex justify-between items-center p-4 bg-gray-800">
          <div className="text-2xl font-bold text-blue-400">Pindrop</div>
        </header>
        <div className="flex-1 overflow-hidden flex">
          <Toolbar 
            panelOpen={panelOpen}
            setPanelOpen={setPanelOpen}
            setDropdownOpen={setDropdownOpen}
            dropdownRef={dropdownRef}
            handleLogout={handleLogout}
            dropdownOpen={dropdownOpen}
            handleOpenSettingsModal={handleOpenSettingsModal}
            user={user}
          />
          <main className={`flex-1 p-8 overflow-y-auto transition-all duration-300 ${panelOpen ? 'ml-64' : 'ml-16'}`}>
            <h1 className="text-3xl font-bold mb-6">Welcome to Your Hub</h1>
            {user && (
              <p className="mb-4">Hello, {user.firstname}!</p>
            )}
            {loading ? (
              <p>Loading pins...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : pins.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {pins.map(pin => (
                  <Card key={pin.id} item={pin} onClick={() => handleOpenPage(pin)} />
                ))}
              </div>
            ) : (
              <div>
                <p>No pins found. Create your first pin!</p>
                <button 
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  onClick={() => {/* Add function to open create pin modal or navigate to create pin page */}}
                >
                  Create New Pin
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      {isSettingsModalOpen && (
        <UserSettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettingsModal}
          onSave={handleSaveUserSettings}
          user={user}
        />
      )}
      {selectedPin && (
        <Page pinId={selectedPin} onClose={handleClosePage} />
      )}
    </SessionAuth>
  );
};

export default Hub;