import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import { QRCodeCanvas } from "qrcode.react";

const Print = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const hasPrintedRef = useRef(false); // ✅ persists across re-renders

  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  // Disability type mapping
  const disabilityTypeOptions = [
    {
      value: "physical",
      label: "Physical Disability",
      description: "Mobility impairments, chronic pain conditions, respiratory disabilities"
    },
    {
      value: "mental_health",
      label: "Mental Health Disability",
      description: "Depression, anxiety disorders, bipolar disorder, PTSD"
    },
    {
      value: "sensory",
      label: "Sensory Disability",
      description: "Blindness, low vision, deafness, hearing loss, sensory processing disorder"
    },
    {
      value: "neurological",
      label: "Neurological Disability",
      description: "Epilepsy, multiple sclerosis, Parkinson's disease, stroke effects"
    },
    {
      value: "developmental",
      label: "Developmental Disability",
      description: "Autism Spectrum Disorder (ASD), intellectual disabilities, cerebral palsy"
    },
    {
      value: "chronic_health",
      label: "Chronic Health Condition",
      description: "Diabetes, heart disease, kidney disease, chronic illnesses"
    },
    {
      value: "other",
      label: "Other Disability",
      description: "Other types not listed above"
    }
  ];

  // Function to get disability label from value
  const getDisabilityLabel = (value) => {
    const disability = disabilityTypeOptions.find(option => option.value === value);
    return disability ? disability.label : value || "-";
  };

  // Function to calculate validity date (5 years from now)
  const getValidityDate = () => {
    const currentDate = new Date();
    const validUntil = new Date(currentDate);
    validUntil.setFullYear(currentDate.getFullYear() + 5);

    // Format as MM/DD/YYYY
    const month = String(validUntil.getMonth() + 1).padStart(2, '0');
    const day = String(validUntil.getDate()).padStart(2, '0');
    const year = validUntil.getFullYear();

    return `${month}/${day}/${year}`;
  };

  // Function to format current date for validation
  const getCurrentDateFormatted = () => {
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const year = currentDate.getFullYear();

    return `${month}/${day}/${year}`;
  };

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.get(`/user/${id}`);
        setMember(res.data);

        const profile = res.data.member_profile || {};
        const fullName = [profile.first_name, profile.middle_name, profile.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();

        // ✅ Set Page Title dynamically
        if (fullName) {
          document.title = `${fullName} - PWD ID`;
        }

        // ✅ Only trigger print ONCE
        if (!hasPrintedRef.current) {
          hasPrintedRef.current = true;
          setTimeout(() => {
            window.print();
          }, 500);

          const handleAfterPrint = () => {
            navigate(`/members/${id}`, { replace: true });
          };

          window.addEventListener("afterprint", handleAfterPrint);

          return () => {
            window.removeEventListener("afterprint", handleAfterPrint);
          };
        }
      } catch (err) {
        console.error("❌ Failed to fetch member:", err);
      }
    };

    fetchMember();
  }, [id, navigate]);

  if (!member) {
    return <p className="text-center text-gray-500">Loading member profile...</p>;
  }

  const profile = member.member_profile || {};
  const documents = profile.documents || {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}/storage/${imagePath}`;
  };

  const picture2x2Url = getImageUrl(documents.picture_2x2);
  const guardianPicture2x2Url = getImageUrl(documents.guardian_picture_2x2);

  // Calculate dates
  const validityDate = getValidityDate();
  const currentDate = getCurrentDateFormatted();

  return (
    <>
      {/* Page Title is already set dynamically in useEffect */}
      <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center">
        {/* Main container for both ID cards */}
        <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
          {/* FRONT SIDE */}
          <div className="relative w-[340px] h-[212px] rounded-md overflow-hidden border-2 border-gray-600 bg-white shadow-lg">
            {/* Header */}
            <div className="bg-sky-700 text-white text-center text-[10px] py-1 font-bold">
              REPUBLIC OF THE PHILIPPINES
            </div>
            <div className="flex justify-between items-center px-2 py-1 border-b border-gray-300">
              <img src="/images/PDAO LOGO.png" alt="Logo" className="w-8 h-8" />
              <p className="text-[10px] font-semibold text-sky-700">
                PERSONS WITH DISABILITY ID CARD
              </p>
              <img src="/images/PH.png" alt="LGU" className="w-8 h-8" />
            </div>

            {/* Body */}
            <div className="flex px-2 py-2">
              {/* Photo Section */}
              <div className="flex flex-col items-center mr-3">
                {picture2x2Url ? (
                  <div className="relative">
                    <img
                      src={picture2x2Url}
                      alt="2x2 ID Photo"
                      className="w-20 h-20 border-2 border-gray-400 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-20 h-20 border-2 border-gray-400 bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 text-center hidden"
                    >
                      2x2 PHOTO<br />Not Available
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-gray-400 bg-gray-200 flex items-center justify-center text-[8px] text-gray-600 text-center">
                    2x2 PHOTO<br />Not Available
                  </div>
                )}
              </div>

              {/* Info Section - Each field on its own line */}
              <div className="flex-1 text-[10px] space-y-[3px]">
                {/* Name */}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-9 flex-shrink-0">Name:</span>
                  <span className="text-gray-900 flex-1">{fullName || "-"}</span>
                </div>

                {/* Sex */}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-7 flex-shrink-0">Sex:</span>
                  <span className="text-gray-900 flex-1">{profile.sex || "-"}</span>
                </div>

                {/* Birthdate */}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-14 flex-shrink-0">Birthdate:</span>
                  <span className="text-gray-900 flex-1">{profile.birthdate || "-"}</span>
                </div>

                {/* Address */}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-12 flex-shrink-0">Address:</span>
                  <span className="text-gray-900 flex-1">{profile.address || "-"}</span>
                </div>

                {/* Disability */}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 w-14 flex-shrink-0">Disability:</span>
                  <span className="text-gray-900 flex-1 ">
                    {getDisabilityLabel(profile.disability_type)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-2 py-1 text-[10px] border-t border-gray-300 bg-gray-50">
              <div className="flex items-center">
                <span className="font-semibold text-gray-700">ID No:</span>
                <span className="font-mono text-gray-900 ml-1">{profile.id_number || "-"}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-[18px] border-b border-gray-500" />
                <p className="text-[8px] text-gray-600 mt-1">Signature of Cardholder</p>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="relative w-[340px] h-[212px] rounded-md overflow-hidden border-2 border-gray-600 bg-white shadow-lg p-3 flex flex-col justify-between">
            {/* Emergency Contact Section with Guardian Photo */}
            <div className="flex justify-between">
              {/* Guardian Info */}
              <div className="text-[10px] space-y-[3px] flex-1">
                <p className="font-semibold text-sky-700 mb-1">In Case of Emergency</p>
                <div className="space-y-[3px]">
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-700 w-16 flex-shrink-0">Guardian:</span>
                    <span className="text-gray-900 flex-1 leading-tight">{profile.guardian_full_name || "-"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-700 w-16 flex-shrink-0">Contact:</span>
                    <span className="text-gray-900 flex-1">{profile.guardian_contact_number || "-"}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-700 w-16 flex-shrink-0">Address:</span>
                    <span className="text-gray-900 flex-1 leading-tight">{profile.guardian_address || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Guardian Photo Section */}
              <div className="flex flex-col items-center ml-2">
                <span className="text-[8px] font-semibold text-gray-700 mb-1 text-center">
                  Guardian Photo
                </span>
                {guardianPicture2x2Url ? (
                  <div className="relative">
                    <img
                      src={guardianPicture2x2Url}
                      alt="Guardian 2x2 Photo"
                      className="w-16 h-16 border-2 border-gray-400 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div
                      className="w-16 h-16 border-2 border-gray-400 bg-gray-200 flex items-center justify-center text-[6px] text-gray-600 text-center hidden"
                    >
                      GUARDIAN<br />PHOTO<br />Not Available
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-gray-400 bg-gray-200 flex items-center justify-center text-[6px] text-gray-600 text-center">
                    GUARDIAN<br />PHOTO<br />Not Available
                  </div>
                )}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="text-[8px] text-gray-700 text-center bg-gray-50 p-1 rounded border border-gray-200 leading-tight mt-1">
              <p>
                This ID card is issued pursuant to RA 9442 & RA 10754.
                It entitles the bearer to privileges and benefits granted by law.
                Any misuse or unauthorized duplication is punishable by law.
              </p>

            </div>

            {/* Footer with QR and Signature */}
            <div className="flex justify-between items-end mt-1">
              <div className="flex flex-col items-center">
                <QRCodeCanvas
                  value={JSON.stringify({
                    id: profile.id_number,
                    name: fullName,
                    type: "PWD",
                    issued: currentDate,
                    valid_until: validityDate
                  })}
                  size={48}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
                <p className="text-[7px] text-gray-600 mt-1 text-center">
                  Scan to Verify
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 border-b border-gray-500 mb-1" />
                <p className="text-[8px] text-gray-600">PDAO Head Signature</p>
                <p className="text-[7px] text-gray-500">PDAO Office</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print instructions */}
        <div className="mt-8 text-center text-sm text-gray-600 print:hidden">
          <p>🖨️ The ID cards above are sized for standard ID printing.</p>
          <p>Make sure to select "Actual Size" or "100%" in your print settings.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              margin: 0.75in;
              size: letter;
            }
            body {
              margin: 0;
              padding: 0;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            /* Center the ID cards on the page */
            .min-h-screen {
              min-height: 0 !important;
              height: 100vh !important;
              padding: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .flex-col {
              gap: 0 !important;
            }
            .md\\:flex-row {
              flex-direction: row !important;
              gap: 0.5in !important;
            }
            /* Ensure ID cards maintain their size */
            .w-\\[340px\\] {
              width: 340px !important;
            }
            .h-\\[212px\\] {
              height: 212px !important;
            }
            /* Remove background colors that might not print well */
            .bg-white {
              background: white !important;
            }
            .bg-gray-50 {
              background: #f9fafb !important;
            }
            .bg-sky-700 {
              background: #0369a1 !important;
            }
            .bg-yellow-50 {
              background: #fefce8 !important;
            }
            /* Ensure no trimming */
            .relative {
              position: relative !important;
            }
            .overflow-hidden {
              overflow: hidden !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default Print;