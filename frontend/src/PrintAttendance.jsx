import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "./api";

function PrintAttendanceReport() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Get data from location state (primary data source)
  const { 
    event: eventFromState, 
    members: membersFromState,
    filters = {},
    statistics = {}
  } = location.state || {};

  useEffect(() => {
    const initPrint = async () => {
      try {
        if (eventFromState && membersFromState) {
          // Use data passed from state - this should be the primary case
          console.log("Using data from location state");
          setLoading(false);
          
          // Set page title
          document.title = `${eventFromState?.title || 'Event'} Attendance Report - PDAO`;
          
          // Trigger print after a short delay to ensure rendering is complete
          setTimeout(() => {
            window.print();
          }, 800);
        } else {
          // Fallback: fetch data if no state provided
          console.log("No location state data, fetching from API");
          const eventResponse = await api.get(`/events/${eventId}`);
          const membersResponse = await api.get(`/events/${eventId}/attendances`);
          
          setLoading(false);
          
          document.title = `${eventResponse.data?.title || 'Event'} Attendance Report - PDAO`;
          
          setTimeout(() => {
            window.print();
          }, 800);
        }
      } catch (error) {
        console.error("Error loading print data:", error);
        setLoading(false);
      }
    };

    initPrint();
  }, [eventId, eventFromState, membersFromState]);

  // Handle manual back navigation
  const handleCancel = () => {
    navigate(`/events/${eventId}/attendances`, { replace: true });
  };

  // Handle manual print
  const handleManualPrint = () => {
    window.print();
  };

  const formatBirthdate = (birthdate) => {
    if (!birthdate) return "—";
    try {
      return new Date(birthdate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "—";
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return "—";
    try {
      const today = new Date();
      const birthDate = new Date(birthdate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing attendance report for printing...</p>
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  // Use state data as primary, with fallbacks
  const displayMembers = membersFromState || [];
  const displayEvent = eventFromState || {};

  // Calculate statistics
  const presentCount = statistics.presentCount || displayMembers.filter(m => m.isPresent).length;
  const expectedOrAbsentCount = statistics.expectedOrAbsentCount || displayMembers.filter(m => !m.isPresent).length;
  const totalMembers = statistics.totalMembers || displayMembers.length;
  const attendanceRate = statistics.attendanceRate || (totalMembers > 0 ? (presentCount / totalMembers * 100).toFixed(1) : 0);

  return (
    <div className="p-8 bg-white print:p-0 print:bg-white">
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              margin: 0.5in;
              size: letter;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background: white;
              font-family: Arial, sans-serif;
            }
            .no-print {
              display: none !important;
            }
            .print-break {
              page-break-after: always;
            }
            .print-break-avoid {
              page-break-inside: avoid;
            }
            .print-shadow {
              box-shadow: none !important;
            }
            .bg-blue-600 {
              background-color: #2563eb !important;
            }
            .bg-green-600 {
              background-color: #059669 !important;
            }
            .bg-red-600 {
              background-color: #dc2626 !important;
            }
            .bg-purple-600 {
              background-color: #7c3aed !important;
            }
            .text-blue-100 {
              color: #dbeafe !important;
            }
          }
          .print-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 11px;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          .print-table th {
            background-color: #2563eb !important;
            color: white !important;
            font-weight: bold;
          }
          .print-table tr:nth-child(even) {
            background-color: #f9fafb;
          }
        `}
      </style>

      {/* Action Buttons - Only visible when not printing */}
      <div className="no-print mb-4 flex gap-2">
        <button
          onClick={handleCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ← Back to Attendance
        </button>
        <button
          onClick={handleManualPrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          🖨️ Print Report
        </button>
      </div>

      {/* Print Instructions */}
      <div className="no-print bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> Use the browser's print dialog to print this report. 
          The print will automatically optimize for paper format.
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-8 print-break-avoid">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 rounded-lg mb-4 print:bg-gradient-to-r print:from-blue-600 print:to-purple-600 print-shadow">
          <h1 className="text-3xl font-bold">Attendance Report</h1>
          <p className="text-blue-100 text-lg mt-2">
            {displayEvent?.title || 'Event'} • {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 print-break-avoid">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 print-shadow">
            <div className="text-2xl font-bold text-blue-600">{totalMembers}</div>
            <div className="text-sm text-blue-800">Total Members</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 print-shadow">
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <div className="text-sm text-green-800">Present</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 print-shadow">
            <div className="text-2xl font-bold text-red-600">{expectedOrAbsentCount}</div>
            <div className="text-sm text-red-800">{statistics.thirdStatLabel || 'Expected/Absent'}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 print-shadow">
            <div className="text-2xl font-bold text-purple-600">{attendanceRate}%</div>
            <div className="text-sm text-purple-800">Attendance Rate</div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-6 print-break-avoid print-shadow">
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Event:</strong> {displayEvent?.title || 'N/A'}</div>
            <div><strong>Date:</strong> {displayEvent?.event_date ? new Date(displayEvent.event_date).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Time:</strong> {displayEvent?.event_time || 'N/A'}</div>
            <div><strong>Location:</strong> {displayEvent?.location || 'N/A'}</div>
            <div><strong>Target Barangay:</strong> {displayEvent?.target_barangay || 'All Barangays'}</div>
            <div><strong>Status:</strong> {displayEvent?.status || 'N/A'}</div>
          </div>
          {(filters.search || filters.barangayFilter !== "All") && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <strong>Active Filters:</strong> 
              {filters.search && ` Search: "${filters.search}"`}
              {filters.barangayFilter !== "All" && ` Barangay: ${filters.barangayFilter}`}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="print-break-avoid">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
          Attendance List ({displayMembers.length} records)
        </h2>
        
        {displayMembers.length === 0 ? (
          <div className="text-center py-8 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 font-medium">No attendance records found for this event.</p>
          </div>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Full Name</th>
                <th style={{ width: '12%' }}>Birthdate</th>
                <th style={{ width: '8%' }}>Age</th>
                <th style={{ width: '12%' }}>Barangay</th>
                <th style={{ width: '15%' }}>Guardian Name</th>
                <th style={{ width: '13%' }}>Contact</th>
                <th style={{ width: '15%' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((member, index) => {
                const profile = member.member_profile || {};
                const fullName = `${profile.first_name || ''} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim() || member.username || 'Unnamed Member';
                
                return (
                  <tr key={member.id || index}>
                    <td className="font-medium">{fullName}</td>
                    <td>{formatBirthdate(profile.birthdate)}</td>
                    <td>{calculateAge(profile.birthdate)}</td>
                    <td>{profile.barangay || '—'}</td>
                    <td>{profile.guardian_full_name || '—'}</td>
                    <td>{profile.guardian_contact_number || '—'}</td>
                    <td className="font-medium">
                      <span className={
                        member.statusVariant === 'present' ? 'text-green-600 font-bold' :
                        member.statusVariant === 'expected' ? 'text-yellow-600 font-bold' :
                        'text-red-600 font-bold'
                      }>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 print-break-avoid">
        <p>Generated on {new Date().toLocaleString()} • {displayMembers.length} attendance records</p>
        <p className="mt-1">Official Document - PDAO Attendance Management System</p>
        <p className="mt-1">Page 1 of 1</p>
      </div>
    </div>
  );
}

export default PrintAttendanceReport;