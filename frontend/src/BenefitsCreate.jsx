import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, CheckCircle } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

function BenefitsCreate() {
    const [form, setForm] = useState({
        name: "",
        type: "",
        amount: "",
        unit: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const typeOptions = [
        { value: "cash", label: "Cash" },
        { value: "relief", label: "Relief Goods" },
        { value: "medical", label: "Medical Assistance" },
        { value: "other", label: "Other" }
    ];

    const unitOptions = [
        { value: "pcs", label: "Pcs" },
        { value: "kg", label: "Kilogram" },
        { value: "liters", label: "Liters" },
        { value: "bundles", label: "Bundles" },
        { value: "pieces", label: "Pieces" },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Add status by default
            const payload = { ...form, status: "active" };

            // Updated API route according to new controller
            await api.post("/benefits", payload);

            setForm({ name: "", type: "", amount: "", unit: "" });
            setShowModal(true);
        } catch (err) {
            const errors = err.response?.data?.errors;
            const errorMessage = errors
                ? Object.values(errors).flat().join(", ")
                : err.response?.data?.message || "Failed to create benefit.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const closeModalAndRedirect = () => {
        setShowModal(false);
        navigate("/benefits/list"); // Updated route to benefits list
    };

    return (
        <>
            <Layout />
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mb-4">
                            <Gift className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Add New Benefit</h1>
                    </div>

                    {error && (
                        <div className="mb-6">
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleCreate} className="space-y-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-gray-700 font-medium mb-2">Benefit Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-gray-700 font-medium mb-2">Type <span className="text-red-500">*</span></label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                                >
                                    <option value="">Select Type</option>
                                    {typeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <label className="block text-gray-700 font-medium mb-2">Amount</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-gray-700 font-medium mb-2">Unit</label>
                                <select
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100"
                                >
                                    <option value="">Select Unit</option>
                                    {unitOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 
                  hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 
                  text-white font-bold text-lg rounded-2xl shadow-xl 
                  transform transition-all duration-200 hover:scale-105 active:scale-95 
                  disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-6 h-6 mr-3" />
                                        Create Benefit
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900">
                                Benefit Created Successfully! 🎉
                            </h3>
                            <button
                                onClick={closeModalAndRedirect}
                                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 
                  text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BenefitsCreate;
