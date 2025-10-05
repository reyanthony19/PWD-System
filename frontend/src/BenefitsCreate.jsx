import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, CheckCircle, Users, Search,X, MapPin, Stethoscope, Calculator } from "lucide-react";
import api from "./api";
import Layout from "./Layout";

function BenefitsCreate() {
    const [form, setForm] = useState({
        name: "",
        type: "",
        per_member_amount: "",
        per_member_quantity: "",
        unit: "",
        locked_member_count: "0",
    });

    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        barangay: "",
        disability_type: ""
    });
    
    const navigate = useNavigate();

    const typeOptions = [
        { value: "cash", label: "Cash Assistance" },
        { value: "relief", label: "Relief Goods" },
    ];

    const unitOptions = [
        { value: "pcs", label: "Pieces" },
        { value: "kg", label: "Kilograms" },
        { value: "liters", label: "Liters" },
        { value: "bundles", label: "Bundles" },
        { value: "sacks", label: "Sacks" },
        { value: "packs", label: "Packs" },
    ];

    // Calculate totals based on per-member amounts and selected members
    const totalBudgetAmount = form.per_member_amount && selectedMembers.length > 0 
        ? (parseFloat(form.per_member_amount) * selectedMembers.length).toFixed(2)
        : "0.00";

    const totalBudgetQuantity = form.per_member_quantity && selectedMembers.length > 0
        ? (parseFloat(form.per_member_quantity) * selectedMembers.length).toFixed(1)
        : "0.0";

    // Fetch members using your existing route
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoadingMembers(true);
                const response = await api.get("/users?role=member");
                // Filter only approved members for selection
                const approvedMembers = response.data.data ? 
                    response.data.data.filter(user => user.status === 'approved') :
                    response.data.filter(user => user.status === 'approved');
                setMembers(approvedMembers);
            } catch (err) {
                setError("Failed to load members. Please try again.");
                console.error("Error fetching members:", err);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchMembers();
    }, []);

    // Get unique barangays and disability types for filters
    const barangays = [...new Set(members.map(member => member.barangay).filter(Boolean))].sort();
    const disabilityTypes = [...new Set(members.map(member => member.disability_type).filter(Boolean))].sort();

    // Filter members based on search and filters
    const filteredMembers = members.filter(member => {
        const matchesSearch = 
            member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.id?.toString().includes(searchTerm) ||
            member.phone?.includes(searchTerm);

        const matchesBarangay = !filters.barangay || member.barangay === filters.barangay;
        const matchesDisabilityType = !filters.disability_type || member.disability_type === filters.disability_type;

        return matchesSearch && matchesBarangay && matchesDisabilityType;
    });

    const handleMemberSelection = (memberId) => {
        setSelectedMembers(prev => {
            const isSelected = prev.includes(memberId);
            let newSelection;
            
            if (isSelected) {
                newSelection = prev.filter(id => id !== memberId);
            } else {
                newSelection = [...prev, memberId];
            }
            
            // Update locked_member_count based on selection
            setForm(prevForm => ({
                ...prevForm,
                locked_member_count: newSelection.length.toString()
            }));
            
            return newSelection;
        });
    };

    const handleSelectAllOnPage = () => {
        const allFilteredIds = filteredMembers.map(member => member.id);
        setSelectedMembers(allFilteredIds);
        setForm(prevForm => ({
            ...prevForm,
            locked_member_count: allFilteredIds.length.toString()
        }));
    };

    const handleDeselectAllOnPage = () => {
        const newSelection = selectedMembers.filter(id => 
            !filteredMembers.some(member => member.id === id)
        );
        setSelectedMembers(newSelection);
        setForm(prevForm => ({
            ...prevForm,
            locked_member_count: newSelection.length.toString()
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        
        if (selectedMembers.length === 0) {
            setError("Please select at least one member to participate in this benefit.");
            return;
        }

        if (!form.name || !form.type) {
            setError("Please fill in all required fields.");
            return;
        }

        if (form.type === "cash" && !form.per_member_amount) {
            setError("Please enter the amount per member for cash benefits.");
            return;
        }

        if (form.type === "relief" && (!form.per_member_quantity || !form.unit)) {
            setError("Please enter quantity per member and select unit for relief goods.");
            return;
        }

        setLoading(true);

        try {
            let payload = {
                name: form.name,
                type: form.type,
                status: "active",
                locked_member_count: selectedMembers.length,
                selected_members: selectedMembers,
            };

            if (form.type === "cash") {
                // Calculate total budget amount from per member amount
                payload.budget_amount = parseFloat(form.per_member_amount) * selectedMembers.length;
                payload.per_participant_amount = parseFloat(form.per_member_amount);
            } else if (form.type === "relief") {
                // Calculate total budget quantity from per member quantity
                payload.budget_quantity = parseFloat(form.per_member_quantity) * selectedMembers.length;
                payload.per_participant_quantity = parseFloat(form.per_member_quantity);
                payload.unit = form.unit;
            }

            await api.post("/benefits", payload);

            setForm({
                name: "",
                type: "",
                per_member_amount: "",
                per_member_quantity: "",
                unit: "",
                locked_member_count: "0",
            });
            setSelectedMembers([]);
            setShowModal(true);
        } catch (err) {
            const errors = err.response?.data?.errors;
            const errorMessage = errors
                ? Object.values(errors).flat().join(", ")
                : err.response?.data?.message || "Failed to create benefit. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({ barangay: "", disability_type: "" });
        setSearchTerm("");
    };

    const closeModalAndRedirect = () => {
        setShowModal(false);
        navigate("/benefits/list");
    };

    return (
        <>
            <Layout />
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 py-8 px-4">
                {/* SEO Meta Tags */}
                <title>Create New Benefit - PWD Management System</title>
                <meta name="description" content="Create a new benefit and select PWD members to participate. Manage cash and relief goods benefits efficiently." />
                <meta name="keywords" content="PWD benefits, cash assistance, relief goods, member selection, disability support, barangay assistance" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mb-4">
                            <Gift className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Create New Benefit
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Create a new benefit and select specific PWD members to participate. 
                            Choose between cash assistance or relief goods distribution.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 max-w-7xl mx-auto">
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <X className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Benefit Form */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <Gift className="w-6 h-6 mr-2" />
                                Benefit Details
                            </h2>
                            
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Benefit Name */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Benefit Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                            placeholder="e.g., Christmas Cash Assistance, Rice Relief Distribution"
                                        />
                                    </div>

                                    {/* Type */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Benefit Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="type"
                                            value={form.type}
                                            onChange={handleChange}
                                            required
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                        >
                                            <option value="">Select Benefit Type</option>
                                            {typeOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Selected Members Count */}
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">
                                            <Users className="w-4 h-4 inline mr-1" />
                                            Selected Participants
                                        </label>
                                        <div className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-semibold text-yellow-600">
                                                    {selectedMembers.length} members selected
                                                </span>
                                                {selectedMembers.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMembers([]);
                                                            setForm(prev => ({ ...prev, locked_member_count: "0" }));
                                                        }}
                                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Select members from the list on the right
                                        </p>
                                    </div>

                                    {/* Per Member Amount (for cash) */}
                                    {form.type === "cash" && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-2">
                                                    Amount Per Member (₱) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="per_member_amount"
                                                    value={form.per_member_amount}
                                                    onChange={handleChange}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                                    placeholder="Enter amount per member"
                                                />
                                            </div>
                                            
                                            {/* Total Budget Calculation */}
                                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                                                        <span className="font-medium text-blue-900">Total Budget:</span>
                                                    </div>
                                                    <span className="text-xl font-bold text-blue-700">
                                                        ₱{totalBudgetAmount}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-blue-600 mt-1">
                                                    {selectedMembers.length} members × ₱{form.per_member_amount || "0"} each
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Per Member Quantity (for relief) */}
                                    {form.type === "relief" && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-gray-700 font-medium mb-2">
                                                        Quantity Per Member <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="per_member_quantity"
                                                        value={form.per_member_quantity}
                                                        onChange={handleChange}
                                                        min="0"
                                                        step="0.1"
                                                        required
                                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                                        placeholder="Enter quantity per member"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-gray-700 font-medium mb-2">
                                                        Unit <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        name="unit"
                                                        value={form.unit}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 cursor-pointer focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
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
                                            
                                            {/* Total Quantity Calculation */}
                                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <Calculator className="w-5 h-5 text-green-600 mr-2" />
                                                        <span className="font-medium text-green-900">Total Quantity:</span>
                                                    </div>
                                                    <span className="text-xl font-bold text-green-700">
                                                        {totalBudgetQuantity} {form.unit}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-green-600 mt-1">
                                                    {selectedMembers.length} members × {form.per_member_quantity || "0"} {form.unit} each
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="text-center pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading || selectedMembers.length === 0 || !form.name || !form.type}
                                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 
                                            hover:from-yellow-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 
                                            text-white font-bold text-lg rounded-2xl shadow-xl 
                                            transform transition-all duration-200 hover:scale-105 active:scale-95 
                                            disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                                Creating Benefit...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-6 h-6 mr-3" />
                                                Create Benefit ({selectedMembers.length} Participants)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Member Selection */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <Users className="w-6 h-6 mr-2" />
                                Select Participants 
                                <span className="ml-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {selectedMembers.length} selected
                                </span>
                            </h2>

                            {/* Search and Filters */}
                            <div className="space-y-4 mb-6">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search members by name, email, phone, or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                    />
                                </div>

                                {/* Filters */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                        <select
                                            value={filters.barangay}
                                            onChange={(e) => setFilters(prev => ({ ...prev, barangay: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                        >
                                            <option value="">All Barangays</option>
                                            {barangays.map(barangay => (
                                                <option key={barangay} value={barangay}>{barangay}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="relative">
                                        <Stethoscope className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                        <select
                                            value={filters.disability_type}
                                            onChange={(e) => setFilters(prev => ({ ...prev, disability_type: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 transition-colors"
                                        >
                                            <option value="">All Disability Types</option>
                                            {disabilityTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center justify-center px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear Filters
                                    </button>
                                </div>

                                {/* Selection Controls */}
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleSelectAllOnPage}
                                            className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Select All on Page
                                        </button>
                                        <button
                                            onClick={handleDeselectAllOnPage}
                                            className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        >
                                            Deselect All on Page
                                        </button>
                                    </div>
                                    <span className="text-sm text-gray-500 font-medium">
                                        Showing {filteredMembers.length} of {members.length} approved members
                                    </span>
                                </div>
                            </div>

                            {/* Members List */}
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {loadingMembers ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                                        <p className="text-gray-500 mt-2">Loading members...</p>
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                        <p className="font-medium">No approved members found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </div>
                                ) : (
                                    filteredMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className={`flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                                                selectedMembers.includes(member.id)
                                                    ? 'bg-yellow-50 border-yellow-500 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-yellow-300 hover:bg-yellow-25'
                                            }`}
                                            onClick={() => handleMemberSelection(member.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => handleMemberSelection(member.id)}
                                                className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mt-1"
                                            />
                                            <div className="ml-4 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-yellow-700">
                                                            {member.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1">{member.email}</p>
                                                    </div>
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                                        ID: {member.id}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {member.barangay && (
                                                        <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {member.barangay}
                                                        </span>
                                                    )}
                                                    {member.disability_type && (
                                                        <span className="inline-flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                                            <Stethoscope className="w-3 h-3 mr-1" />
                                                            {member.disability_type}
                                                        </span>
                                                    )}
                                                    {member.phone && (
                                                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                                            📞 {member.phone}
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        member.status === 'approved' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
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
                            <p className="text-gray-600 mb-4">
                                Your benefit "<strong>{form.name}</strong>" has been created successfully.
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                                <p className="text-sm text-yellow-800">
                                    <strong>{selectedMembers.length}</strong> members have been enrolled in this benefit.
                                </p>
                                {form.type === "cash" && (
                                    <p className="text-sm text-yellow-800 mt-1">
                                        Each member will receive: <strong>₱{form.per_member_amount}</strong>
                                    </p>
                                )}
                                {form.type === "relief" && (
                                    <p className="text-sm text-yellow-800 mt-1">
                                        Each member will receive: <strong>{form.per_member_quantity} {form.unit}</strong>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={closeModalAndRedirect}
                                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 
                                    text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                            >
                                View Benefits List
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BenefitsCreate;