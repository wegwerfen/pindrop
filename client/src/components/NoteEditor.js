import React, { useMemo, useEffect, useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import ReactMarkdown from 'react-markdown';
import ReactDOMServer from 'react-dom/server';
import PropTypes from 'prop-types';
import 'easymde/dist/easymde.min.css'; // Import EasyMDE CSS
import '../styles/easymde-dark-theme.css'; // Import the custom dark theme CSS

const NoteEditor = ({ content, onChange, pinId, onSave, onClose, isSaving }) => {
  const autosaveId = `note-editor-autosave-${pinId}`;
  const [editorContent, setEditorContent] = useState('');

  useEffect(() => {
    const autosavedValue = localStorage.getItem(autosaveId);
    if (autosavedValue) {
      setEditorContent(autosavedValue);
      onChange(autosavedValue);
    } else {
      setEditorContent(content);
    }
  }, [autosaveId, content, onChange]);

  const handleChange = (value) => {
    setEditorContent(value);
    onChange(value);
    localStorage.setItem(autosaveId, value);
  };

  const options = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Enter your note here...',
    autofocus: true,
    status: false,
    hideIcons: ['guide'],
    previewClass: 'prose prose-invert max-w-none bg-gray-900 p-4',
    sideBySideFullscreen: false,
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link', 'image', '|',
      'preview', 'side-by-side', 'fullscreen', '|',
      'guide'
    ],
    previewRender(plainText) {
      return ReactDOMServer.renderToString(
        <ReactMarkdown className="prose prose-invert max-w-none">
          {plainText}
        </ReactMarkdown>
      );
    },
    autosave: {
      enabled: false,
    },
  }), []);

  return (
    <div className="editor-wrapper flex-1 flex flex-col min-h-0 overflow-hidden">
      <SimpleMDE
        value={editorContent}
        onChange={handleChange}
        options={options}
        className="flex-1"
      />
      <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-end space-x-4">
        <button
          onClick={() => onSave(editorContent)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </button>
        <button
          onClick={() => onClose(editorContent)}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
          disabled={isSaving}
        >
          Close
        </button>
      </div>
    </div>
  );
};

NoteEditor.propTypes = {
  content: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  pinId: PropTypes.number.isRequired,  // Change this to number
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
};

export default NoteEditor;