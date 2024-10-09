import React from 'react';

const CharacterCardModal = ({ cardData, onClose }) => {
  const isV2 = cardData.spec === 'chara_card_v2';
  const data = isV2 ? cardData.data : cardData;

  const renderField = (label, value) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <textarea
        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
        rows="3"
        readOnly
        value={value || ''}
      />
    </div>
  );

  const renderArrayField = (label, array) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      {array && array.map((item, index) => (
        <input
          key={index}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
          type="text"
          readOnly
          value={item}
        />
      ))}
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <h3 className="text-xl font-semibold mb-4 text-white">Character Card Data</h3>
        {renderField('Name', data.name)}
        {renderField('Description', data.description)}
        {renderField('Personality', data.personality)}
        {renderField('Scenario', data.scenario)}
        {renderField('First Message', data.first_mes)}
        {renderField('Message Example', data.mes_example)}
        
        {isV2 && (
          <>
            {renderField('Creator Notes', data.creator_notes)}
            {renderField('System Prompt', data.system_prompt)}
            {renderField('Post History Instructions', data.post_history_instructions)}
            {renderArrayField('Alternate Greetings', data.alternate_greetings)}
            {renderArrayField('Tags', data.tags)}
            {renderField('Creator', data.creator)}
            {renderField('Character Version', data.character_version)}
          </>
        )}
        
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CharacterCardModal;
