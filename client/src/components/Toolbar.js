import React, { useState, useRef, useEffect } from 'react';
import { Settings, PanelLeftOpen, PanelLeftClose, Plus, Folder, Tag, Globe, Image, FileText, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import Avatar from './Avatar';
import AdminModal from './AdminModal';
import Page from './Page'; // Import the Page component

const Toolbar = ({ 
  panelOpen, 
  setPanelOpen, 
  setDropdownOpen, 
  dropdownRef, 
  handleLogout, 
  dropdownOpen,
  handleOpenSettingsModal,
  user,
  refreshHub,
  onAddNote // New prop for handling note addition
}) => {
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [webpageDropdownOpen, setWebpageDropdownOpen] = useState(false);
  const [webpageUrl, setWebpageUrl] = useState('');
  const addDropdownRef = useRef(null);
  const webpageDropdownRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const imageDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleAddClick = async (type) => {
    if (type === 'Webpage') {
      setWebpageDropdownOpen(true);
    } else if (type === 'Image') {
      setImageDropdownOpen(true);
    } else if (type === 'Note') {
      try {
        const response = await axios.post('/api/pins', { type: 'note' });
        const newPin = response.data.pin;
        setAddDropdownOpen(false);
        onAddNote(newPin.id); // Call the onAddNote function passed from Hub
        if (refreshHub) {
          refreshHub();
        }
      } catch (error) {
        console.error('Error creating new note:', error);
        // Handle error (e.g., show an error message to the user)
      }
    } else {
      // Handle other types
      console.log(`Adding new ${type}`);
      setAddDropdownOpen(false);
    }
  };

  const handleSaveWebpage = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'webpage',
          url: webpageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save webpage');
      }

      setWebpageUrl('');
      setWebpageDropdownOpen(false);
      setAddDropdownOpen(false);
      refreshHub(); // Call refreshHub after successful save
    } catch (error) {
      console.error('Error saving webpage:', error);
      setError('Failed to save webpage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelWebpage = () => {
    setWebpageUrl('');
    setWebpageDropdownOpen(false);
  };

  const handleOpenAdminModal = () => {
    setAdminModalOpen(true);
    setDropdownOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid image file (jpg, png, or webp)');
    }
  };

  const handleSaveImage = async () => {
    if (!imageUrl && !selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      let formData = new FormData();
      formData.append('type', 'image');

      if (selectedFile) {
        formData.append('image', selectedFile);
        console.log('Appended file:', selectedFile.name);
      } else if (imageUrl) {
        formData.append('url', imageUrl);
        console.log('Appended URL:', imageUrl);
      }

      // Log form data
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post('/api/pins', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Image saved successfully:', response.data);
      setImageUrl('');
      setSelectedFile(null);
      setImageDropdownOpen(false);
      setAddDropdownOpen(false);
      refreshHub(); // Call refreshHub after successful save
    } catch (error) {
      console.error('Error saving image:', error.response ? error.response.data : error.message);
      setError('Failed to save image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelImage = () => {
    setImageUrl('');
    setSelectedFile(null);
    setImageDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target)) {
        setAddDropdownOpen(false);
      }
      if (webpageDropdownRef.current && !webpageDropdownRef.current.contains(event.target)) {
        setWebpageDropdownOpen(false);
      }
      if (imageDropdownRef.current && !imageDropdownRef.current.contains(event.target)) {
        setImageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-50"> {/* Add this wrapper div with z-50 */}
      <div className={`bg-gray-800 fixed top-[64px] bottom-0 left-0 flex flex-col py-4 transition-all duration-300 ${panelOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex flex-col space-y-6 w-full">
          <button 
            onClick={() => setPanelOpen(!panelOpen)}
            className={`p-1 text-gray-300 hover:text-white focus:outline-none ${panelOpen ? 'self-end mr-2' : 'w-full flex justify-center'}`}
          >
            {panelOpen ? <PanelLeftClose size={32} /> : <PanelLeftOpen size={32} />}
          </button>
          <div className="flex items-center relative" ref={addDropdownRef}>
            <button 
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="w-16 p-1 text-gray-300 hover:text-white focus:outline-none flex justify-center"
            >
              <Plus size={32} />
            </button>
            {panelOpen && <span className="ml-2 text-gray-300">Add</span>}
            {addDropdownOpen && (
              <div className="absolute left-full top-0 mt-2 w-64 bg-gray-700 rounded-md shadow-lg py-2">
                <button 
                  onClick={() => handleAddClick('Webpage')}
                  className="flex items-center w-full text-left px-4 py-3 text-lg text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <Globe size={32} className="mr-4 text-blue-400" />
                  Webpage
                </button>
                <button 
                  onClick={() => handleAddClick('Image')}
                  className="flex items-center w-full text-left px-4 py-3 text-lg text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <Image size={32} className="mr-4 text-green-400" />
                  Image
                </button>
                <button 
                  onClick={() => handleAddClick('Note')}
                  className="flex items-center w-full text-left px-4 py-3 text-lg text-gray-300 hover:bg-gray-600 hover:text-white"
                >
                  <FileText size={32} className="mr-4 text-yellow-400" />
                  Note
                </button>
              </div>
            )}
            {webpageDropdownOpen && (
              <div ref={webpageDropdownRef} className="absolute left-full top-0 mt-2 ml-64 w-80 bg-gray-700 rounded-md shadow-lg p-4">
                <input
                  type="text"
                  value={webpageUrl}
                  onChange={(e) => setWebpageUrl(e.target.value)}
                  placeholder="Enter URL"
                  className="w-full p-2 mb-4 bg-gray-600 text-white rounded"
                />
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelWebpage}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveWebpage}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            {imageDropdownOpen && (
              <div ref={imageDropdownRef} className="absolute left-full top-0 mt-2 ml-64 w-80 bg-gray-700 rounded-md shadow-lg p-4">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="w-full p-2 mb-4 bg-gray-600 text-white rounded"
                />
                <div className="flex items-center mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Upload size={16} className="mr-2" />
                    Browse
                  </button>
                  {selectedFile && (
                    <span className="ml-2 text-white">{selectedFile.name}</span>
                  )}
                </div>
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelImage}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveImage}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <button className="w-16 p-1 text-gray-300 hover:text-white focus:outline-none flex justify-center">
              <Folder size={32} />
            </button>
            {panelOpen && <span className="ml-2 text-gray-300">Collections</span>}
          </div>
          <div className="flex items-center">
            <button className="w-16 p-1 text-gray-300 hover:text-white focus:outline-none flex justify-center">
              <Tag size={32} />
            </button>
            {panelOpen && <span className="ml-2 text-gray-300">Tags</span>}
          </div>
        </div>
        <div className="mt-auto flex flex-col space-y-6 w-full">
          <div className="flex items-center">
            <button 
              onClick={handleOpenSettingsModal}
              className="w-16 p-1 text-gray-300 hover:text-white focus:outline-none flex justify-center"
            >
              <Settings size={32} />
            </button>
            {panelOpen && <span className="ml-2 text-gray-300">Settings</span>}
          </div>
          <div className="flex items-center" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-16 focus:outline-none flex justify-center"
            >
              <Avatar 
                imageUrl={user?.avatarUrl} 
                firstName={user?.firstname}
                lastName={user?.lastname}
              />
            </button>
            {panelOpen && <span className="ml-2 text-gray-300">{user?.firstname || 'User'}</span>}
            {dropdownOpen && (
              <div className="absolute left-full bottom-0 mb-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
                <button 
                  onClick={handleOpenSettingsModal}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  User Settings
                </button>
                {user?.isAdmin && (
                  <button 
                    onClick={handleOpenAdminModal}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Admin
                  </button>
                )}
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
      </div>
      {adminModalOpen && (
        <AdminModal onClose={() => setAdminModalOpen(false)} />
      )}
    </div>
  );
};

export default Toolbar;