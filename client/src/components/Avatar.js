import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ imageUrl, firstName, lastName }) => {
  const getInitials = () => {
    const firstInitial = firstName ? firstName[0].toUpperCase() : '';
    const lastInitial = lastName ? lastName[0].toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const initials = getInitials();

  return (
    <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-400 flex items-center justify-center">
      {imageUrl ? (
        <img src={imageUrl} alt="User avatar" className="w-full h-full object-cover" />
      ) : initials ? (
        <span className="text-white text-lg font-semibold">{initials}</span>
      ) : (
        <User className="w-8 h-8 text-white" />
      )}
    </div>
  );
};

export default Avatar;
