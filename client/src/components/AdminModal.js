import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [pins, setPins] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsersSelected, setAllUsersSelected] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUsers.length > 0) {
      fetchPins(selectedUsers);
    } else {
      setPins([]);
    }
  }, [selectedUsers]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/users`, { withCredentials: true });
      console.log('User data from server:', response.data);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPins = async (userIds) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/pins`, {
        params: { userIds: userIds.join(',') },
        withCredentials: true
      });
      setPins(response.data.pins);
    } catch (error) {
      console.error('Error fetching pins:', error);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (allUsersSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
    setAllUsersSelected(!allUsersSelected);
  };

  const handleDeletePins = async () => {
    // Implement pin deletion logic here
    console.log('Deleting selected pins');
  };

  const handleOpenSuperTokens = () => {
    const superTokensUrl = `${process.env.REACT_APP_API_URL}/auth/dashboard/`;
    window.open(superTokensUrl, '_blank', 'noopener,noreferrer');
  };

  // Add these console.log statements here, just before the return statement
  console.log('Users:', users);
console.log('User IDs:', users.map(user => user.id));
console.log('Pin IDs:', pins.map(pin => pin.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg w-3/4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4 text-white">Site Admin</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-white">Users</h3>
          <div className="overflow-x-auto">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                  <tr>
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input
                          id="checkbox-all-users"
                          type="checkbox"
                          checked={allUsersSelected}
                          onChange={handleSelectAllUsers}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="checkbox-all-users" className="sr-only">checkbox</label>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">User Name</th>
                    <th scope="col" className="px-6 py-3">Email Address</th>
                    <th scope="col" className="px-6 py-3">Number of Pins</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="bg-gray-800 border-b border-gray-700">
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input
                            id={`checkbox-${user.id}`}
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor={`checkbox-${user.id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap">{`${user.firstName} ${user.lastName}`}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.pinCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2 text-white">Pins</h3>
          <div className="overflow-x-auto">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                  <tr>
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input id="checkbox-all-pins" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" />
                        <label htmlFor="checkbox-all-pins" className="sr-only">checkbox</label>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">Title</th>
                    <th scope="col" className="px-6 py-3">Type</th>
                    <th scope="col" className="px-6 py-3">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {pins.map((pin) => (
                    <tr key={`pin-${pin.id}`} className="bg-gray-800 border-b border-gray-700">
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input 
                            id={`checkbox-pin-${pin.id}`} 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
                          />
                          <label htmlFor={`checkbox-pin-${pin.id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{pin.title}</td>
                      <td className="px-6 py-4">{pin.type}</td>
                      <td className="px-6 py-4">{pin.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button
            onClick={handleDeletePins}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Selected Pins
          </button>
        </div>

        <div className="mt-6 mb-4">
          <button
            onClick={handleOpenSuperTokens}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            SuperTokens
          </button>
          <span className="ml-2 text-white">Open SuperTokens admin page</span>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminModal;