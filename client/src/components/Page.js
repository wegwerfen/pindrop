import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MousePointerClick, Image, FileText, ExternalLink, Trash2, Plus, Tag, Download, Minus, RotateCcw, Maximize, NotebookText, Wand2, User } from 'lucide-react';
import axios from '../axiosConfig';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import ExifReader from 'exifreader';
import CharacterCardModal from './CharacterCardModal';
import NoteEditor from './NoteEditor';
import PropTypes from 'prop-types';

const Page = ({ pinId, onClose }) => {
  // Convert pinId to a number if it's not already
  const numericPinId = typeof pinId === 'string' ? parseInt(pinId, 10) : pinId;

  const [isMouseOutside, setIsMouseOutside] = useState(false);
  const [viewMode, setViewMode] = useState('screenshot');
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [originalComments, setOriginalComments] = useState('');
  const [hasUnsavedComments, setHasUnsavedComments] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tags, setTags] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [classification, setClassification] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const [showExifModal, setShowExifModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [exifData, setExifData] = useState(null);
  const [aiMetadata, setAiMetadata] = useState(null);
  const [showCharacterCardModal, setShowCharacterCardModal] = useState(false);
  const [characterCardData, setCharacterCardData] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const pageRef = useRef(null);

  const handleCommentsChange = useCallback((e) => {
    setComments(e.target.value);
    setHasUnsavedComments(e.target.value !== originalComments);
  }, [originalComments]);

  const saveComments = useCallback(async () => {
    if (hasUnsavedComments) {
      try {
        await axios.put(`/api/pins/${pinId}/comments`, { comments });
        console.log('Comments saved successfully');
        setOriginalComments(comments);
        setHasUnsavedComments(false);
      } catch (error) {
        console.error('Error saving comments:', error);
      }
    }
  }, [pinId, comments, hasUnsavedComments]);

  const saveNoteToServer = useCallback(async (content) => {
    try {
      const noteData = {
        content,
        title,
        summary,
        tags,
        comments,
      };
      const response = await axios.put(`/api/pins/${pinId}/note`, noteData);
      console.log('Note saved successfully');
      
      setHasUnsavedChanges(false);
      const autosaveId = `note-editor-autosave-${pinId}`;
      localStorage.removeItem(autosaveId);

      // Handle AI analysis results if needed
      if (response.data.pin.analysis) {
        // Update state with analysis results
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [pinId, title, summary, tags, comments]);

  const handleClose = useCallback(async () => {
    await saveComments();
    onClose();
  }, [saveComments, onClose]);

  const handleNoteClose = useCallback(async (content) => {
    if (hasUnsavedChanges) {
      await saveNoteToServer(content);
    }
    await saveComments();
    const autosaveId = `note-editor-autosave-${pinId}`;
    localStorage.removeItem(autosaveId);
    onClose();
  }, [saveNoteToServer, pinId, onClose, hasUnsavedChanges, saveComments]);

  useEffect(() => {
    const fetchPinDetails = async () => {
      try {
        const response = await axios.get(`/api/pins/${pinId}`);
        console.log('Pin details:', response.data.pin);
        setPin(response.data.pin);
        setComments(
          response.data.pin.Webpage?.comments || 
          response.data.pin.Images?.comments || 
          response.data.pin.Note?.comments || 
          ''
        );
        setClassification(response.data.pin.classification || '');
        setTitle(response.data.pin.Note?.title || '');  // Set initial title
        setSummary(
          response.data.pin.Webpage?.summary || 
          response.data.pin.Images?.summary || 
          response.data.pin.Note?.summary || 
          '');  // Set initial summary
        if (response.data.pin.type === 'image' && response.data.pin.image && response.data.pin.image.filePath) {
          const fullImageUrl = `${process.env.REACT_APP_API_URL}/uploads/${response.data.pin.image.filePath}`;
          console.log('Setting image URL:', fullImageUrl);
          setImageUrl(fullImageUrl);
        } else if (response.data.pin.type === 'note') {
          const autosaveId = `note-editor-autosave-${pinId}`;
          const autosavedContent = localStorage.getItem(autosaveId);
          if (autosavedContent && autosavedContent !== response.data.pin.Note.content) {
            setNoteContent(autosavedContent);
            setHasUnsavedChanges(true);
          } else {
            setNoteContent(response.data.pin.Note.content || '');
            setLastSavedContent(response.data.pin.Note.content || '');
          }
        }
        // Set tags from the pin data
        setTags(response.data.pin.tags || []);
        const pinComments = response.data.pin.Webpage?.comments || 
                          response.data.pin.Images?.comments || 
                          response.data.pin.Note?.comments || 
                          '';
        setComments(pinComments);
        setOriginalComments(pinComments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pin details:', error);
        setLoading(false);
      }
    };

    fetchPinDetails();
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

  useEffect(() => {
    const fetchExifData = async () => {
      if (pin && pin.type === 'image' && imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const tags = ExifReader.load(arrayBuffer);
          setExifData(tags);
          
          // Check for AI metadata
          let aiData = null;
          if (tags.UserComment) {
            aiData = decodeUnicode(tags.UserComment.value || tags.UserComment.description);
          } else if (tags.parameters) {
            aiData = decodeUnicode(tags.parameters.value || tags.parameters.description);
          } else if (tags.prompt) {
            aiData = decodeUnicode(tags.prompt.value || tags.prompt.description);
          } else if (tags.chara) {
            // Handle character card data
            const charaData = decodeUnicode(tags.chara.value || tags.chara.description);
            try {
              const decodedData = JSON.parse(atob(charaData));
              setCharacterCardData(decodedData);
            } catch (error) {
              console.error('Error parsing character card data:', error);
            }
          }
          
          if (aiData) {
            setAiMetadata(aiData);
          }
        } catch (error) {
          console.error('Error reading EXIF data:', error);
        }
      }
    };

    fetchExifData();
  }, [pin, imageUrl]);

  const decodeUnicode = (value) => {
    if (Array.isArray(value)) {
      let result = '';
      for (let i = 0; i < value.length; i += 2) {
        if (value[i] === 0 && value[i+1] !== 0) {
          result += String.fromCharCode(value[i+1]);
        } else {
          result += String.fromCharCode((value[i] << 8) | value[i+1]);
        }
      }
      return result;
    }
    return value;
  };

  const handleDeleteConfirm = useCallback(async () => {
    try {
      if (pin && pin.type === 'image' && pin.image && pin.image.filePath) {
        setImageUrl(''); // This will unmount the img element
      }

      // Wait a bit to ensure the browser has released the file
      await new Promise(resolve => setTimeout(resolve, 100));

      await axios.delete(`/api/pins/${pinId}`);
      onClose(); // Close the page after successful deletion
    } catch (error) {
      console.error('Error deleting pin:', error);
      // Optionally, show an error message to the user
    }
    setShowDeleteConfirmation(false);
  }, [pin, pinId, onClose]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirmation(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirmation(false);
  }, []);

  const handleExifClick = useCallback(async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);
      console.log('Raw ExifReader output:', tags);
      setExifData(tags);
      setShowExifModal(true);
    } catch (error) {
      console.error('Error reading EXIF data:', error);
      setExifData(null);
    }
  }, [imageUrl]);

  const renderExifModal = () => {
    if (!showExifModal) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing the page
      >
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
          <h3 className="text-xl font-semibold mb-4 text-white">EXIF Data</h3>
          {exifData ? (
            <div className="space-y-2">
              {Object.entries(exifData).map(([key, value]) => (
                <div key={key} className="text-gray-300">
                  <span className="font-semibold">{key}:</span>{' '}
                  {typeof value.description === 'string' || Array.isArray(value.value)
                    ? decodeUnicode(value.value || value.description)
                    : JSON.stringify(value.description)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300">No EXIF data available for this image.</p>
          )}
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            onClick={() => setShowExifModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderAIModal = () => {
    if (!showAIModal) return null;
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing the page
      >
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
          <h3 className="text-xl font-semibold mb-4 text-white">AI Generation Metadata</h3>
          <pre className="text-gray-300 whitespace-pre-wrap">{aiMetadata}</pre>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            onClick={() => setShowAIModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const handleNoteSave = useCallback(async (content) => {
    await saveNoteToServer(content);
  }, [saveNoteToServer]);

  const handleNoteChange = useCallback((value) => {
    setNoteContent(value);
    setHasUnsavedChanges(true);
    
    // Save to local storage
    const autosaveId = `note-editor-autosave-${pinId}`;
    localStorage.setItem(autosaveId, value);
  }, [pinId]);

  const handleTitleChange = useCallback((value) => {
    setTitle(value);
  }, []);

  const handleSummaryChange = useCallback((value) => {
    setSummary(value);
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim()) {
      setTags(prevTags => [...prevTags, newTag.trim()]);
      setNewTag('');
      setIsAddingTag(false);
    }
  }, [newTag]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
  }, []);

  const renderLeftSection = useCallback(() => {
    if (!pin) return null;

    console.log('Rendering left section for pin:', pin);

    if (pin.type === 'webpage') {
      const htmlContent = pin.Webpage?.cleanContent || '';
      const screenshotPath = pin.Webpage?.screenshot || null;

      console.log('Screenshot path:', screenshotPath);
      console.log('HTML content length:', htmlContent.length);

      return (
        <div className="h-full flex flex-col relative">
          <div className="flex-grow overflow-auto custom-scrollbar">
            {viewMode === 'screenshot' ? (
              screenshotPath ? (
                <img 
                  src={`/uploads/${pin.userId}/screenshots/${screenshotPath}`} 
                  alt="Webpage screenshot" 
                  className="w-full" 
                  onError={(e) => {
                    console.error('Error loading screenshot:', e);
                    e.target.src = '/path/to/fallback/image.jpg'; // Replace with an actual fallback image path
                  }}
                />
              ) : (
                <div className="text-white p-4">
                  No screenshot available. Debug info: 
                  <pre>{JSON.stringify({ screenshot: pin.Webpage?.screenshot, userId: pin.userId }, null, 2)}</pre>
                </div>
              )
            ) : (
              htmlContent ? (
                <div 
                  className="prose prose-invert max-w-none overflow-auto h-full p-4 bg-gray-950 text-gray-200 custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <div className="text-white p-4">No content available</div>
              )
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
    } else if (pin.type === 'image') {
      console.log('Rendering image pin:', pin);
      if (!imageUrl) {
        console.log('Image URL is missing');
        return <div className="text-white">Image not found</div>;
      }

      return (
        <div className="h-full bg-gray-950 flex flex-col items-center justify-center custom-scrollbar relative">
          {!imageError ? (
            <>
              <TransformWrapper>
                {({ zoomIn, zoomOut, resetTransform, centerView, ...rest }) => (
                  <React.Fragment>
                    <div className="absolute top-4 left-4 flex space-x-2 z-10">
                      <button
                        onClick={() => zoomIn()}
                        className="p-2 rounded-full bg-gray-700 opacity-75 hover:opacity-100 transition-opacity"
                        title="Zoom in"
                      >
                        <Plus size={20} />
                      </button>
                      <button
                        onClick={() => zoomOut()}
                        className="p-2 rounded-full bg-gray-700 opacity-75 hover:opacity-100 transition-opacity"
                        title="Zoom out"
                      >
                        <Minus size={20} />
                      </button>
                      <button
                        onClick={() => resetTransform()}
                        className="p-2 rounded-full bg-gray-700 opacity-75 hover:opacity-100 transition-opacity"
                        title="Reset zoom"
                      >
                        <RotateCcw size={20} />
                      </button>
                      <button
                        onClick={() => centerView()}
                        className="p-2 rounded-full bg-gray-700 opacity-75 hover:opacity-100 transition-opacity"
                        title="Center image"
                      >
                        <Maximize size={20} />
                      </button>
                    </div>
                    <TransformComponent>
                      <img 
                        src={imageUrl}
                        alt={pin.title} 
                        className="max-w-full max-h-[80%] object-contain mb-4" 
                        onError={() => {
                          console.error('Error loading image:', imageUrl);
                          setImageError(true);
                        }}
                      />
                    </TransformComponent>
                  </React.Fragment>
                )}
              </TransformWrapper>
              <div className="absolute bottom-4 left-4 flex">
                <a
                  href={imageUrl}
                  download={`${pin.title || 'image'}.${pin.image.type}`}
                  className="p-2 rounded-full bg-gray-700 opacity-75 hover:opacity-100 transition-opacity"
                  title="Download image"
                >
                  <Download size={20} />
                </a>
              </div>
            </>
          ) : (
            <div className="text-white">Error loading image</div>
          )}
        </div>
      );
    } else if (pin.type === 'note') {
      return (
        <div className="h-full flex flex-col">
          <NoteEditor
            content={noteContent}
            onChange={handleNoteChange}
            pinId={numericPinId}  // Use the numeric pinId here
            onSave={handleNoteSave}
            onClose={handleNoteClose}
            isSaving={isSaving}
          />
        </div>
      );
    }
  }, [pin, imageUrl, imageError, viewMode, noteContent, numericPinId, handleNoteChange, handleNoteSave, handleNoteClose, isSaving]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!pin) {
    return null;
  }

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

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 dark"
      onClick={handleClose}
    >
      {isMouseOutside && (
        <div 
          className="absolute top-4 left-0 right-0 text-center text-white z-10 pointer-events-none"
        >
          <span className="bg-gray-800 px-4 py-2 rounded-full inline-flex items-center">
            ESC or <MousePointerClick size={20} className="ml-2 mr-1" /> to close page
          </span>
        </div>
      )}
      <div 
        ref={pageRef}
        className={`bg-gray-950 rounded-lg shadow-2xl overflow-hidden flex w-[93%] h-[93%]`}
        onClick={(e) => e.stopPropagation()} // Prevent click from closing the page
      >
        <div className="flex-1 p-2 flex">
          <div className="flex-1 overflow-auto relative bg-gray-950 custom-scrollbar flex flex-col min-h-0">
            {renderLeftSection()}
          </div>
          <div className="w-2 bg-gray-950" /> {/* 8px spacer */}
          <div className="w-[400px] flex-shrink-0 bg-gray-950 rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="p-4 bg-gray-800 border-b border-gray-700">
              <h2 className="text-xl font-semibold mb-2 text-white truncate" title={pin?.title}>{pin?.title}</h2>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Pinned: {pin?.createdAt && new Date(pin.createdAt).toLocaleDateString()}</span>
                {pin?.url && (
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
              <p className="text-gray-300 mb-1">Type: {pin?.type}</p>
              {pin?.type === 'image' && pin?.image && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Image Details</h3>
                  <p className="text-gray-300">Size: {pin.image.width}x{pin.image.height}</p>
                  <p className="text-gray-300">Format: {pin.image.type}</p>
                </div>
              )}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
                <div className="bg-gray-900 border-2 border-blue-400 rounded-lg p-3">
                  <textarea
                    value={summary}
                    onChange={(e) => handleSummaryChange(e.target.value)}
                    placeholder="Enter summary..."
                    className="w-full bg-gray-900 text-gray-300 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {classification && (
                    <span className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center">
                      <Tag size={16} className="mr-1" /> {classification}
                    </span>
                  )}
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        className="ml-2 text-gray-400 hover:text-white"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                  {isAddingTag ? (
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
                  ) : (
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm flex items-center"
                      onClick={() => setIsAddingTag(true)}
                    >
                      <Plus size={16} className="mr-1" /> Add tag
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Comments</h3>
                <div className="bg-gray-900 border-2 border-blue-400 rounded-lg p-3">
                  <textarea
                    value={comments}
                    onChange={handleCommentsChange}
                    placeholder="Enter comments..."
                    className="w-full bg-gray-900 text-gray-300 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between">
              {pin?.type === 'image' && (
                <>
                  <button
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                    onClick={() => setShowExifModal(true)}
                    title="View EXIF data"
                  >
                    <NotebookText size={20} />
                  </button>
                  {aiMetadata && (
                    <button
                      className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200 ml-2"
                      onClick={() => setShowAIModal(true)}
                      title="View AI Generation Metadata"
                    >
                      <Wand2 size={20} />
                    </button>
                  )}
                  {characterCardData && (
                    <button
                      className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 ml-2"
                      onClick={() => setShowCharacterCardModal(true)}
                      title="View Character Card Data"
                    >
                      <User size={20} />
                    </button>
                  )}
                </>
              )}
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
      {renderExifModal()}
      {renderAIModal()}
      {showCharacterCardModal && (
        <CharacterCardModal 
          cardData={characterCardData} 
          onClose={() => setShowCharacterCardModal(false)} 
        />
      )}
    </div>
  );
};

// Update Page prop types if necessary
Page.propTypes = {
  pinId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Page;