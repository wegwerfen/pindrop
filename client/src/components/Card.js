import React, { useState } from 'react';
import { FileIcon, FileTextIcon, ImageIcon, ExternalLinkIcon } from 'lucide-react';

const Card = ({ item, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getIconForType = (type) => {
    switch (type) {
      case 'webpage':
        return <FileIcon className="w-12 h-12 text-blue-400" />;
      case 'note':
        return <FileTextIcon className="w-12 h-12 text-green-400" />;
      case 'image':
        return <ImageIcon className="w-12 h-12 text-purple-400" />;
      default:
        return null;
    }
  };

  const handleImageError = () => {
    console.error(`Failed to load image for ${item.title}`, {
      userId: item.userId,
      thumbnail: item.thumbnail,
      fullItem: item
    });
    setImageError(true);
  };

  const imageUrl = item.thumbnail && item.userId
    ? `${process.env.REACT_APP_API_URL}/uploads/${item.userId}/thumbnails/${item.thumbnail.replace(/\\/g, '/').replace('thumbnails/', '')}`
    : null;

  const getDomain = (url) => {
    if (!url) return 'No URL';
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 overflow-hidden transform hover:-translate-y-1 relative cursor-pointer z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="aspect-w-16 aspect-h-9 bg-gray-700 overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {getIconForType(item.type)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 truncate">{item.title}</h3>
        <p className="text-sm text-gray-400 capitalize">{item.type}</p>
        <p className="text-xs text-gray-500 mt-2">Created: {new Date(item.created).toLocaleDateString()}</p>
      </div>
      {isHovered && item.type === 'webpage' && item.url && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gray-700 py-2 px-4 flex items-center cursor-pointer hover:bg-gray-600 transition-colors duration-200"
          onClick={handleLinkClick}
        >
          <ExternalLinkIcon className="w-4 h-4 mr-2 text-blue-400" />
          <span className="text-sm text-gray-300 truncate">{getDomain(item.url)}</span>
        </div>
      )}
    </div>
  );
};

export default Card;