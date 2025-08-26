import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "./api";
import Layout from "./Layout";
import { QRCodeCanvas } from "qrcode.react";
import { useReactToPrint } from "react-to-print";

function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printRef = useRef(null);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/${id}`);
        setMember(res.data);
      } catch (err) {
        console.error("❌ Error fetching member:", err);
        setError(err.response?.data?.message || "Failed to load member profile.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMember();
    else {
      setError("Invalid member ID.");
      setLoading(false);
    }
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "PWD-ID",
    removeAfterPrint: true,
  });

  if (loading)
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-blue-700">
          <div className="w-16 h-16 border-8 border-blue-200 border-t-blue-700 rounded-full animate-spin"></div>
          <p className="mt-4 text-xl font-semibold animate-pulse">
            Loading Member Profile...
          </p>
          <p className="text-gray-600 text-sm">Please wait a moment 🧑‍🦽</p>
        </div>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <p className="p-6 text-red-600">{error}</p>
      </Layout>
    );

  if (!member)
    return (
      <Layout>
        <p className="p-6">No member data found.</p>
      </Layout>
    );

  const profile = member.role === "member" ? member.member_profile || {} : {};
  const documents = member.role === "member" ? profile.documents || {} : {};

  const fullName = [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <Layout>
      {/* Print styles */}
      <style>
        {`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .print-area {
              margin: 0 auto;
              box-shadow: none !important;
            }
            @page {
              size: auto;
              margin: 12mm;
            }
          }
        `}
      </style>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-sky-700 p-6">
            <h1 className="text-3xl font-bold text-white">
              {fullName || member.username || "-"}
            </h1>
            <p className="text-blue-100 capitalize">{member.role} Profile</p>
          </div>

          {/* Personal Information */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-sky-700">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", value: fullName || "-" },
                { label: "ID Number", value: profile.id_number },
                { label: "Birthdate", value: profile.birthdate },
                { label: "Sex", value: profile.sex },
                { label: "Guardian Full Name", value: profile.guardian_full_name },
                { label: "Guardian Relationship", value: profile.guardian_relationship },
                { label: "Guardian Contact Number", value: profile.guardian_contact_number },
                { label: "Guardian Address", value: profile.guardian_address },
                { label: "Disability Type", value: profile.disability_type },
                { label: "Barangay", value: profile.barangay },
                { label: "Address", value: profile.address },
                { label: "Blood Type", value: profile.blood_type },
                { label: "SSS Number", value: profile.sss_number },
                { label: "PhilHealth Number", value: profile.philhealth_number },
              ].map((f, i) => (
                <div key={i}>
                  <p className="text-gray-500 text-sm">{f.label}</p>
                  <p className="font-medium">{f.value || "-"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          {member.role === "member" && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold mb-4 text-sky-700">Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Barangay Indigency", value: documents.barangay_indigency },
                  { label: "Medical Certificate", value: documents.medical_certificate },
                  { label: "2x2 Picture", value: documents.picture_2x2 },
                  { label: "Birth Certificate", value: documents.birth_certificate },
                ].map((doc, index) => (
                  <div key={index}>
                    <p className="text-gray-500 text-sm mb-2">{doc.label}</p>
                    {doc.value ? (
                      <p className="font-medium text-gray-800 break-words">{doc.value}</p>
                    ) : (
                      <p className="text-gray-400 italic">Not uploaded</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ID Card Section */}
          {member.role === "member" && (
            <div className="p-6 border-t">
              <h2 className="text-xl font-semibold mb-4 text-sky-700">ID Card</h2>

              <div ref={printRef}>
                <div className="print-area flex flex-col md:flex-row gap-6 items-start">
                  {/* FRONT */}
                  <div className="relative w-[340px] h-[212px] rounded-xl overflow-hidden shadow-lg border bg-white print:w-[3.375in] print:h-[2.125in]">
                    {/* Blue gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100" />

                    {/* Blue wave accents */}
                    <svg
                      className="absolute -top-10 -left-16"
                      width="300"
                      height="240"
                      viewBox="0 0 300 240"
                      fill="none"
                    >
                      <path
                        d="M0,120 C60,60 120,40 180,80 C240,120 300,110 340,80 L340,0 L0,0 Z"
                        fill="#2563eb"
                        opacity="0.9"
                      />
                      <path
                        d="M0,140 C70,100 140,120 200,100 C260,80 300,90 340,120 L340,0 L0,0 Z"
                        fill="#1d4ed8"
                        opacity="0.6"
                      />
                    </svg>

                    {/* Header/logo */}
                    <div className="relative z-10 flex items-center justify-between px-3 pt-3">
                      <div className="text-white drop-shadow font-bold text-sm">
                        PERSONS WITH DISABILITY AFFAIRS OFFICE
                      </div>
                      <img
                        src="/images/PDAO LOGO.png"
                        alt="Logo"
                        className="w-8 h-8 object-contain rounded bg-white/80 p-0.5"
                      />
                    </div>

                    {/* Photo + info */}
                    <div className="relative z-10 px-3 pt-2 flex gap-3">
                      {documents.picture_2x2 ? (
                        <img
                          src={documents.picture_2x2}
                          alt="2x2"
                          className="w-16 h-16 border-2 border-white rounded-md object-cover shadow"
                        />
                      ) : (
                        <div className="w-16 h-16 border-2 border-white rounded-md bg-gray-50 flex items-center justify-center text-[10px] text-gray-500 shadow">
                          2x2 PHOTO
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-800 leading-tight">
                          {fullName || "-"}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">ID No:</span> {profile.id_number || "-"}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Barangay:</span> {profile.barangay || "-"}
                        </p>
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Disability:</span>{" "}
                          {profile.disability_type || "-"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom stripe / QR */}
                    <div className="absolute bottom-0 left-0 right-0 pb-2 px-2 flex items-end justify-between">
                      <div className="text-[10px] text-gray-600">Valid with municipal verification.</div>
                      <div className="bg-white p-1 rounded shadow">
                        {profile.id_number ? (
                          <QRCodeCanvas
                            value={String(profile.id_number)}
                            size={56}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                            includeMargin={true}
                          />
                        ) : (
                          <div className="w-[56px] h-[56px] border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-500">
                            No ID
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="relative w-[340px] h-[212px] rounded-xl overflow-hidden shadow-lg border bg-white print:w-[3.375in] print:h-[2.125in]">
                    {/* Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100" />
                    <svg
                      className="absolute -bottom-14 -right-20 rotate-180"
                      width="320"
                      height="260"
                      viewBox="0 0 320 260"
                      fill="none"
                    >
                      <path
                        d="M0,160 C60,200 140,200 200,170 C260,140 300,120 340,140 L340,260 L0,260 Z"
                        fill="#2563eb"
                        opacity="0.9"
                      />
                      <path
                        d="M0,130 C70,170 140,190 200,170 C260,150 300,150 340,170 L340,260 L0,260 Z"
                        fill="#1d4ed8"
                        opacity="0.6"
                      />
                    </svg>

                    <div className="relative z-10 h-full flex flex-col justify-between p-3">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-800">Card Details</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-800">
                          <div>
                            <span className="font-semibold">Birthdate: </span>
                            {profile.birthdate || "-"}
                          </div>
                          <div>
                            <span className="font-semibold">Blood Type: </span>
                            {profile.blood_type || "-"}
                          </div>
                          <div className="col-span-2">
                            <span className="font-semibold">Guardian: </span>
                            {profile.guardian_full_name || "-"}
                          </div>
                          <div>
                            <span className="font-semibold">Contact: </span>
                            {profile.guardian_contact_number || "-"}
                          </div>
                          <div>
                            <span className="font-semibold">Address: </span>
                            {profile.guardian_address || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-700 leading-snug bg-white/70 rounded p-2">
                        This card is property of the Municipality. If found, please return to the nearest
                        Barangay Hall. Tampering or misuse is punishable by law.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="no-print mt-4 bg-sky-700 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              >
                🖨️ Print ID
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 border-t flex justify-between items-center">
            <Link to="/member" className="text-blue-600 hover:underline font-medium">
              ← Back to List
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MemberProfile;
