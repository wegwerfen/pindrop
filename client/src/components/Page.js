import React, { useState, useEffect, useRef } from 'react';
import { MousePointerClick, Image, FileText, ExternalLink, Trash2, Plus, Tag } from 'lucide-react';
import axios from '../axiosConfig';

const Page = ({ pinId, onClose }) => {
  const [isMouseOutside, setIsMouseOutside] = useState(false);
  const [viewMode, setViewMode] = useState('screenshot');
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tags, setTags] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [classification, setClassification] = useState('');

  const pageRef = useRef(null);

  useEffect(() => {
    
    const fetchPinDetails = async () => {
      try {
        const response = await axios.get(`/api/pins/${pinId}`);
        setPin(response.data.pin);
        setNotes(response.data.pin.notes || '');
        setClassification(response.data.pin.classification || '');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pin details:', error);
        setLoading(false);
      }
    };

    const fetchTags = async () => {
      try {
        const response = await axios.get(`/api/pins/${pinId}/tags`);
        setTags(response.data.tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchPinDetails();
    fetchTags();
  }, [pinId]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        const isOutside = 
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        setIsMouseOutside(isOutside);
      }
    };

    const handleMouseLeave = () => {
      setIsMouseOutside(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!pin) return null;

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
    if (pin.url) {
      window.open(pin.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleNotesBlur = async () => {
    try {
      await axios.put(`/api/pins/${pinId}/notes`, { notes });
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/pins/${pinId}`);
      onClose(); // Close the page after successful deletion
    } catch (error) {
      console.error('Error deleting pin:', error);
      // Optionally, show an error message to the user
    }
    setShowDeleteConfirmation(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  const handleAddTag = async () => {
    if (newTag.trim()) {
      try {
        await axios.put(`/api/pins/${pinId}/tags`, { tags: [...tags.map(t => t.name), newTag] });
        setTags([...tags, { name: newTag.trim() }]);
        setNewTag('');
        setIsAddingTag(false);
      } catch (error) {
        console.error('Error adding tag:', error);
      }
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      const updatedTags = tags.filter(tag => tag.name !== tagToRemove);
      await axios.put(`/api/pins/${pinId}/tags`, { tags: updatedTags.map(t => t.name) });
      setTags(updatedTags);
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const renderLeftSection = () => {
    if (pin.type === 'webpage') {
      const htmlContent = pin.cleanContent || '';

      return (
        <div className="h-full flex flex-col relative">
          <div className="flex-grow overflow-auto custom-scrollbar">
            {viewMode === 'screenshot' ? (
              <img src={`/uploads/${pin.userId}/screenshots/${pin.screenshot}`} alt="Webpage screenshot" className="w-full" />
            ) : (
              <div 
                className="prose prose-invert max-w-none overflow-auto h-full p-4 bg-gray-950 text-gray-200 custom-scrollbar"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
          <div className="absolute bottom-4 left-4 flex">
            <button
              className={`mr-2 p-2 rounded-full ${viewMode === 'screenshot' ? 'bg-blue-500' : 'bg-gray-700'} opacity-75 hover:opacity-100 transition-opacity`}
              onClick={() => setViewMode('screenshot')}
            >
              <Image size={20} />
            </button>
            <button
              className={`p-2 rounded-full ${viewMode === 'reader' ? 'bg-blue-500' : 'bg-gray-700'} opacity-75 hover:opacity-100 transition-opacity`}
              onClick={() => setViewMode('reader')}
            >
              <FileText size={20} />
            </button>
          </div>
        </div>
      );
    } else if (pin.type === 'note') {
      return (
        <div 
          className="prose prose-invert max-w-none overflow-auto h-full p-4 bg-gray-950 text-gray-200 custom-scrollbar"
          
        />
      );
    } else if (pin.type === 'image') {
      return (
        <div className="h-full bg-gray-950 flex items-center justify-center custom-scrollbar">
          <img src={`/uploads/${pin.userId}/images/${pin.filePath}`} alt={pin.title} className="max-w-full max-h-full object-contain" />
        </div>
      );
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      {isMouseOutside && (
        <div className="absolute top-4 left-0 right-0 text-center text-white">
          <span className="bg-gray-800 px-4 py-2 rounded-full inline-flex items-center">
            ESC or <MousePointerClick size={20} className="ml-2 mr-1" /> to close page
          </span>
        </div>
      )}
      <div 
        ref={pageRef}
        className={`bg-gray-950 rounded-lg shadow-2xl overflow-hidden flex transition-all duration-300 ${
          isMouseOutside ? 'w-[90%] h-[90%]' : 'w-[93%] h-[93%]'
        } ${
          isMouseOutside ? 'shadow-lg' : 'shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-hidden p-2 flex">
          <div className="flex-1 overflow-auto relative bg-gray-950 custom-scrollbar">
            {renderLeftSection()}
          </div>
          <div className="w-2 bg-gray-950" /> {/* 8px spacer */}
          <div className="w-[400px] flex-shrink-0 bg-gray-950 rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <h2 className="text-xl font-semibold mb-2 text-white truncate" title={pin.title}>{pin.title}</h2>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Pinned: {new Date(pin.created).toLocaleDateString()}</span>
                {pin.url && (
                  <div 
                    className="flex items-center cursor-pointer hover:text-blue-400 transition-colors duration-200"
                    onClick={handleLinkClick}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    <span className="truncate max-w-[150px]">{getDomain(pin.url)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-900">
              <p className="text-gray-300 mb-1">Type: {pin.type}</p>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                <div className="bg-gray-900 border-2 border-blue-400 rounded-lg p-3">
                  <p className="text-gray-300">{pin.excerpt || 'No summary available.'}</p>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm flex items-center"
                    onClick={() => setIsAddingTag(true)}
                  >
                    <Plus size={16} className="mr-1" /> Add tag
                  </button>
                  {classification && (
                    <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center">
                      <Tag size={16} className="mr-1" /> {classification}
                    </span>
                  )}
                  {tags.map((tag) => (
                    <span
                      key={tag.name}
                      className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center"
                    >
                      {tag.name}
                      <button
                        className="ml-2 text-gray-400 hover:text-white"
                        onClick={() => handleRemoveTag(tag.name)}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {isAddingTag && (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="px-2 py-1 bg-gray-800 text-white rounded-l-full text-sm"
                        placeholder="New tag"
                      />
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded-r-full text-sm"
                        onClick={handleAddTag}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                <textarea
                  className="w-full bg-gray-800 text-gray-300 rounded-lg p-2 resize-none"
                  rows={1}
                  placeholder="Add your notes here..."
                  value={notes}
                  onChange={handleNotesChange}
                  onBlur={handleNotesBlur}
                  style={{ minHeight: '2.5rem', height: 'auto' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
              </div>
            </div>
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-end">
              <button
                className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
                onClick={handleDeleteClick}
                title="Delete page"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-white">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this page? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;