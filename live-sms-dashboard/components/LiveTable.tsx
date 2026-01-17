
import React from 'react';
import { SmsRecord } from '../types';

interface LiveTableProps {
  records: SmsRecord[];
  loading: boolean;
}

const LiveTable: React.FC<LiveTableProps> = ({ records, loading }) => {
  return (
    <div className="mx-4 mt-6 bg-white rounded-md shadow-sm overflow-hidden border border-gray-200">
      <div className="bg-[#6c757d] text-white px-4 py-3 font-semibold text-base">
        Live SMS
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b text-gray-800 text-sm font-semibold">
              <th className="px-4 py-4 whitespace-nowrap">Live SMS</th>
              <th className="px-4 py-4 whitespace-nowrap">SID</th>
              <th className="px-4 py-4 whitespace-nowrap">Paid</th>
              <th className="px-4 py-4 whitespace-nowrap">Limit</th>
              <th className="px-4 py-4 whitespace-nowrap">Message content</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading real-time data...</span>
                  </div>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-gray-400 italic">
                  No SMS data available at the moment.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <td className="px-4 py-3">{record.liveSms}</td>
                  <td className="px-4 py-3 font-mono text-xs">{record.sid}</td>
                  <td className="px-4 py-3">{record.paid}</td>
                  <td className="px-4 py-3">{record.limit}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{record.messageContent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveTable;
