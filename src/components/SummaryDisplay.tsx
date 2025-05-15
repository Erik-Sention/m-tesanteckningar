import React from 'react';

interface SummaryDisplayProps {
  summary: string;
  onExportWord: () => void;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, onExportWord }) => {
  return (
    <div className="mt-8 p-6 bg-purple-50 border-l-4 border-purple-600 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-purple-900">Sammanfattning</h3>
        <button
          onClick={onExportWord}
          className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 transition-colors"
        >
          Exportera som Word-fil
        </button>
      </div>
      <div className="text-gray-900 whitespace-pre-wrap" style={{wordBreak: 'break-word'}}>
        {summary}
      </div>
    </div>
  );
};

export default SummaryDisplay; 