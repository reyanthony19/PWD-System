import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api";
import { QRCodeCanvas } from "qrcode.react";

const Print = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const hasPrintedRef = useRef(false); // ✅ persists across re-renders

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

  return (
    <>
      {/* Page Title is already set dynamically in useEffect */}
      <div className="p-6 flex flex-col items-center space-y-6 print:space-y-0 print:flex-row print:justify-center bg-gray-100">
        {/* FRONT SIDE */}
        <div className="relative w-[340px] h-[212px] rounded-md overflow-hidden border border-gray-400 bg-white shadow print:w-[3.375in] print:h-[2.125in]">
          {/* Header */}
          <div className="bg-sky-700 text-white text-center text-[10px] py-1 font-bold">
            REPUBLIC OF THE PHILIPPINES
          </div>
          <div className="flex justify-between items-center px-2 py-1 border-b">
            <img src="/images/PDAO LOGO.png" alt="Logo" className="w-8 h-8" />
            <p className="text-[10px] font-semibold text-sky-700">
              PERSONS WITH DISABILITY ID CARD
            </p>
            <img src="/images/PH.png" alt="LGU" className="w-8 h-8" />
          </div>

          {/* Body */}
          <div className="flex px-2 py-2">
            {/* Photo */}
            {documents.picture_2x2 ? (
              <img
                src={documents.picture_2x2}
                alt="2x2"
                className="w-20 h-20 border border-gray-400 object-cover"
              />
            ) : (
              <div className="w-20 h-20 border border-gray-400 bg-gray-200 flex items-center justify-center text-[10px]">
                2x2 PHOTO
              </div>
            )}

            {/* Info */}
            <div className="ml-2 text-[11px] leading-tight">
              <p><span className="font-semibold">Name:</span> {fullName}</p>
              <p><span className="font-semibold">Sex:</span> {profile.sex || "-"}</p>
              <p><span className="font-semibold">Birthdate:</span> {profile.birthdate || "-"}</p>
              <p><span className="font-semibold">Address:</span> {profile.address || "-"}</p>
              <p><span className="font-semibold">Disability:</span> {profile.disability_type || "-"}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-2 py-1 text-[10px]">
            <p><span className="font-semibold">ID No:</span> {profile.id_number || "-"}</p>
            <div className="flex flex-col items-center">
              <div className="w-20 h-[20px] border-b border-gray-500" />
              <p className="text-[9px]">Signature of Cardholder</p>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="relative w-[340px] h-[212px] rounded-md overflow-hidden border border-gray-400 bg-white shadow print:w-[3.375in] print:h-[2.125in] p-2 flex flex-col justify-between">
          <div className="text-[10px] leading-tight">
            <p className="font-semibold text-sky-700">In Case of Emergency</p>
            <p><span className="font-semibold">Guardian:</span> {profile.guardian_full_name || "-"}</p>
            <p><span className="font-semibold">Contact:</span> {profile.guardian_contact_number || "-"}</p>
            <p><span className="font-semibold">Address:</span> {profile.guardian_address || "-"}</p>
          </div>

          <div className="text-[9px] text-gray-700">
            This ID card is issued pursuant to RA 9442 & RA 10754.
            It entitles the bearer to privileges and benefits granted by law.
          </div>

          <div className="flex justify-between items-end">
            <div>
              <QRCodeCanvas
                value={String(profile.id_number || "")}
                size={48}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 border-b border-gray-500" />
              <p className="text-[9px]">PDAO Head</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Print;
