import React, { useState, useEffect, useCallback } from 'react';
import Avatar from './Avatar'; // Add this import
import axios from 'axios'; // Make sure to import axios

function UserSettingsModal({ user, onClose, onSave }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    number: false,
    match: false,
  });
  const [isThirdPartyUser, setIsThirdPartyUser] = useState(false);

  // Update local state when user prop changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFirstName(user.firstname || '');
      setLastName(user.lastname || '');
      setIsThirdPartyUser(!!user.thirdParty);
    }
  }, [user]);

  const checkPasswordCriteria = useCallback((password) => {
    setPasswordCriteria({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      match: password === verifyPassword && password !== '',
    });
  }, [verifyPassword]);

  useEffect(() => {
    checkPasswordCriteria(newPassword);
  }, [newPassword, checkPasswordCriteria]);

  if (!user) {
    return null;
  }

  const handleUpdate = () => {
    onSave({ firstName, lastName });
  };

  const handleChangePassword = async () => {
    try {
      const response = await axios.post('/api/user/change-password', {
        oldPassword,
        newPassword
      }, { withCredentials: true });

      if (response.status === 200) {
        // Password changed successfully
        alert('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setVerifyPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg w-1/2 max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-white">User Settings</h2>
        <div className="mb-6 flex items-center">
        <Avatar 
          imageUrl={user?.avatarUrl} 
          firstName={user?.firstname}
          lastName={user?.lastname}
        />
          {user.isAdmin && (
            <span className="ml-4 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              Admin
            </span>
          )}
        </div>
        <div className="mb-4 flex items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${user.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {user.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update
          </button>
        </div>
        <hr className="my-4" /> {/* Horizontal divider */}
        <h3 className="text-xl font-bold mb-4 text-white">Change Password</h3> {/* Change Password title */}
        
        {isThirdPartyUser ? (
          <p className="text-yellow-400 mb-4">
            Password change is not available for users logged in with a third-party provider.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
                className="w-full px-3 py-2 border rounded-md mb-2"
              />
            </div>
            <div className="mb-4 relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full px-3 py-2 border rounded-md mb-2"
              />
              {passwordCriteria.length && (
                <span className="absolute right-2 top-2 text-green-500">✓</span>
              )}
            </div>
            <div className="mb-4 relative">
              <input
                type="password"
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                placeholder="Verify New Password"
                className="w-full px-3 py-2 border rounded-md"
              />
              {passwordCriteria.match && (
                <span className="absolute right-2 top-2 text-green-500">✓</span>
              )}
            </div>
            <div className="mb-4">
              <p className={`text-sm ${passwordCriteria.length ? 'text-green-500' : 'text-red-500'}`}>
                ✓ At least 8 characters long
              </p>
              <p className={`text-sm ${passwordCriteria.lowercase ? 'text-green-500' : 'text-red-500'}`}>
                ✓ Contains at least one lowercase character
              </p>
              <p className={`text-sm ${passwordCriteria.number ? 'text-green-500' : 'text-red-500'}`}>
                ✓ Contains at least one number
              </p>
            </div>
            <div className="flex justify-end mb-4">
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!Object.values(passwordCriteria).every(Boolean)}
              >
                Save
              </button>
            </div>
          </>
        )}

        {/* Add other user settings form fields here */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded mr-2 hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserSettingsModal;