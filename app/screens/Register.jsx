import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Text,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
} from "react-native";
import { Provider as PaperProvider, TextInput, RadioButton, Divider } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get("window");

const theme = {
  colors: {
    primary: '#2563eb',
    accent: '#10b981',
    background: 'transparent',
    surface: 'white',
    text: '#111827',
    disabled: 'rgba(0, 0, 0, 0.26)',
    placeholder: '#6b7280',
  },
  roundness: 12,
};

function Register() {
  const navigation = useNavigation();

  const [form, setForm] = useState({
    // User credentials
    username: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Personal Information
    first_name: "",
    middle_name: "",
    last_name: "",
    severity: "",
    monthly_income: "",
    dependent: "",
    birthdate: new Date(),
    sex: "",
    address: "",
    barangay: "",
    contact_number: "",

    // Optional fields
    id_number: "",
    disability_type: "",
    blood_type: "",
    sss_number: "",
    philhealth_number: "",

    // Guardian Information
    guardian_full_name: "",
    guardian_relationship: "",
    guardian_contact_number: "",
    guardian_address: "",

    // Remarks
    remarks: "",
  });

  const [documents, setDocuments] = useState({
    barangay_indigency: null,
    medical_certificate: null,
    picture_2x2: null,
    birth_certificate: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  // Dropdown modal state
  const [dropdownModal, setDropdownModal] = useState({
    visible: false,
    field: '',
    options: [],
    title: ''
  });

  // Options matching web version
  const barangayOptions = [
    "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
    "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
    "Poblacion", "Taboc", "Tingalan"
  ];

  const severityOptions = [
    "Mild", "Moderate", "Severe", "Profound"
  ];

  // Monthly income options - send these exact string values
  const monthlyIncomeOptions = [
    { value: "below_5000", label: "Below ₱5,000", description: "Extremely low income" },
    { value: "5000_10000", label: "₱5,000 - ₱10,000", description: "Low income" },
    { value: "10000_20000", label: "₱10,000 - ₱20,000", description: "Lower middle income" },
    { value: "20000_30000", label: "₱20,000 - ₱30,000", description: "Middle income" },
    { value: "30000_50000", label: "₱30,000 - ₱50,000", description: "Upper middle income" },
    { value: "above_50000", label: "Above ₱50,000", description: "High income" },
    { value: "no_income", label: "No Income", description: "Unemployed or no regular income" }
  ];

  const bloodTypeOptions = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"
  ];

  // Updated disability types to match PHP array exactly
  const disabilityTypeOptions = [
    { value: "physical", label: "Physical Disability" },
    { value: "mental_health", label: "Mental Health Disability" },
    { value: "sensory", label: "Sensory Disability" },
    { value: "neurological", label: "Neurological Disability" },
    { value: "developmental", label: "Developmental Disability" },
    { value: "chronic_health", label: "Chronic Health Condition" },
    { value: "other", label: "Other Disability" }
  ];

  const guardianRelationshipOptions = [
    { value: "parent", label: "Parent" },
    { value: "spouse", label: "Spouse" },
    { value: "child", label: "Child" },
    { value: "sibling", label: "Sibling" },
    { value: "grandparent", label: "Grandparent" },
    { value: "aunt_uncle", label: "Aunt/Uncle" },
    { value: "cousin", label: "Cousin" },
    { value: "guardian", label: "Legal Guardian" },
    { value: "other", label: "Other" }
  ];

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, birthdate: selectedDate }));
    }
  };

  const openDropdown = (field, title) => {
    let options = [];

    switch (field) {
      case 'barangay':
        options = barangayOptions;
        break;
      case 'severity':
        options = severityOptions;
        break;
      case 'monthly_income':
        options = monthlyIncomeOptions;
        break;
      case 'blood_type':
        options = bloodTypeOptions;
        break;
      case 'disability_type':
        options = disabilityTypeOptions;
        break;
      case 'guardian_relationship':
        options = guardianRelationshipOptions;
        break;
      default:
        options = [];
    }

    setDropdownModal({
      visible: true,
      field,
      options,
      title
    });
  };

  const closeDropdown = () => {
    setDropdownModal({
      visible: false,
      field: '',
      options: [],
      title: ''
    });
  };

  const handleSelect = (value, label) => {
    handleChange(dropdownModal.field, value);
    closeDropdown();
  };

  const handleDocumentPick = async (type) => {
    try {
      let result;
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

      if (type === 'picture_2x2') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled) {
          const fileType = result.assets[0].mimeType || 'image/jpeg';
          if (!allowedTypes.includes(fileType)) {
            Alert.alert('Invalid File Type', 'Please select a JPG, JPEG, or PNG file.');
            return;
          }

          setDocuments(prev => ({
            ...prev,
            [type]: {
              uri: result.assets[0].uri,
              type: fileType,
              name: 'profile_picture.jpg'
            }
          }));
        }
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          const fileType = file.mimeType;

          // Validate file types for barangay_indigency
          if (type === 'barangay_indigency' && !allowedTypes.includes(fileType)) {
            Alert.alert('Invalid File Type', 'Barangay Indigency must be JPG, JPEG, PNG, or PDF file.');
            return;
          }

          // Validate image types for other documents
          if (type !== 'barangay_indigency' && !fileType.startsWith('image/')) {
            Alert.alert('Invalid File Type', 'Please select an image file (JPG, JPEG, PNG).');
            return;
          }

          setDocuments(prev => ({
            ...prev,
            [type]: {
              uri: file.uri,
              type: fileType,
              name: file.name
            }
          }));
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateCurrentSection = () => {
    const currentSectionData = sections[currentSection];
    const requiredFields = currentSectionData.fields.filter(field => field.required);

    for (const field of requiredFields) {
      if (!form[field.name] && field.name !== 'guardian_full_name' &&
        field.name !== 'guardian_relationship' && field.name !== 'guardian_contact_number' &&
        field.name !== 'guardian_address') {

        // Special validation for documents section
        if (currentSection === 4 && field.type === 'image') {
          if (!documents[field.name]) {
            setError(`${field.label} is required`);
            return false;
          }
        } else {
          setError(`${field.label} is required`);
          return false;
        }
      }
    }

    // Additional validation for passwords
    if (currentSection === 0 && form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      return false;
    }

    if (currentSection === 0 && form.password.length < 3) {
      setError("Password must be at least 3 characters long.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (currentSection === 0 && !emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentSection()) {
      return;
    }
    setCurrentSection(prev => prev + 1);
    setError("");
  };

  const validateForm = () => {
    // Required fields validation for final submission
    const requiredFields = [
      'username', 'email', 'password', 'confirmPassword',
      'first_name', 'last_name', 'severity', 'monthly_income',
      'birthdate', 'sex', 'address', 'barangay'
    ];

    for (const field of requiredFields) {
      if (!form[field]) {
        setError(`Please fill in ${field.replace('_', ' ')}`);
        return false;
      }
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirmation do not match.");
      return false;
    }

    if (form.password.length < 3) {
      setError("Password must be at least 3 characters long.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  // Create proper FormData with file objects
  const createFormData = () => {
    const formData = new FormData();

    // Debug logging
    console.log('Creating FormData with:', {
      username: form.username,
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      severity: form.severity,
      monthly_income: form.monthly_income, // This should be the string value like "20000_30000"
      birthdate: form.birthdate.toISOString().split('T')[0],
      sex: form.sex,
      address: form.address,
      barangay: form.barangay
    });

    // User credentials
    formData.append("username", form.username);
    formData.append("email", form.email);
    formData.append("password", form.password);

    // Required profile fields
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("severity", form.severity);

    // FIXED: Send the string value directly (e.g., "20000_30000")
    formData.append("monthly_income", form.monthly_income);

    formData.append("birthdate", form.birthdate.toISOString().split('T')[0]);
    formData.append("sex", form.sex);
    formData.append("address", form.address);
    formData.append("barangay", form.barangay);

    // Optional fields - only append if they have values
    if (form.middle_name && form.middle_name.trim() !== '') {
      formData.append("middle_name", form.middle_name);
    }
    if (form.dependent && form.dependent.trim() !== '') {
      formData.append("dependent", parseInt(form.dependent) || 0);
    }
    if (form.contact_number && form.contact_number.trim() !== '') {
      formData.append("contact_number", form.contact_number);
    }
    if (form.id_number && form.id_number.trim() !== '') {
      formData.append("id_number", form.id_number);
    }
    if (form.disability_type && form.disability_type.trim() !== '') {
      formData.append("disability_type", form.disability_type);
    }
    if (form.blood_type && form.blood_type.trim() !== '') {
      formData.append("blood_type", form.blood_type);
    }
    if (form.sss_number && form.sss_number.trim() !== '') {
      formData.append("sss_number", form.sss_number);
    }
    if (form.philhealth_number && form.philhealth_number.trim() !== '') {
      formData.append("philhealth_number", form.philhealth_number);
    }

    // Guardian information (optional)
    if (form.guardian_full_name && form.guardian_full_name.trim() !== '') {
      formData.append("guardian_full_name", form.guardian_full_name);
    }
    if (form.guardian_relationship && form.guardian_relationship.trim() !== '') {
      formData.append("guardian_relationship", form.guardian_relationship);
    }
    if (form.guardian_contact_number && form.guardian_contact_number.trim() !== '') {
      formData.append("guardian_contact_number", form.guardian_contact_number);
    }
    if (form.guardian_address && form.guardian_address.trim() !== '') {
      formData.append("guardian_address", form.guardian_address);
    }

    // Remarks
    if (form.remarks && form.remarks.trim() !== '') {
      formData.append("remarks", form.remarks);
    }

    // Append documents - create proper file objects
    Object.entries(documents).forEach(([key, document]) => {
      if (document) {
        console.log(`Appending document ${key}:`, document);
        // Create proper file object for FormData
        const fileObject = {
          uri: document.uri,
          type: document.type,
          name: document.name
        };
        formData.append(key, fileObject);
      }
    });

    return formData;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const formData = createFormData();

      console.log('Sending registration request...');

      const res = await api.post("/member/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });

      console.log('Registration successful:', res.data);

      // Navigate to Success screen instead of showing Alert
      navigation.navigate("RegistrationSuccess", {
        userData: {
          username: form.username,
          email: form.email,
          // Add any other user data you want to display
        }
      });

    } catch (err) {
      // ... error handling remains the same
    }
    setLoading(false);
  };
  // Helper function to get display value for dropdowns
  const getDisplayValue = (fieldName, value) => {
    if (!value) return `Select ${fieldName.replace('_', ' ')}`;

    if (fieldName === 'monthly_income') {
      const option = monthlyIncomeOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    }

    if (fieldName === 'disability_type') {
      const option = disabilityTypeOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    }

    if (fieldName === 'guardian_relationship') {
      const option = guardianRelationshipOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    }

    return value;
  };

  // Custom Dropdown Modal Component
  const DropdownModal = () => (
    <Modal
      visible={dropdownModal.visible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeDropdown}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{dropdownModal.title}</Text>
            <TouchableOpacity onPress={closeDropdown} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={dropdownModal.options}
            keyExtractor={(item, index) =>
              item.value ? item.value : item.toString() + index
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => handleSelect(
                  item.value !== undefined ? item.value : item,
                  item.label !== undefined ? item.label : item
                )}
              >
                <Text style={styles.optionText}>
                  {item.label !== undefined ? item.label : item}
                </Text>
                {form[dropdownModal.field] === (item.value !== undefined ? item.value : item) && (
                  <Ionicons name="checkmark" size={20} color="#2563eb" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.optionSeparator} />}
          />
        </View>
      </View>
    </Modal>
  );

  const sections = [
    {
      title: "Account Information",
      fields: [
        { name: 'username', label: 'Username', icon: 'person', required: true },
        { name: 'email', label: 'Email Address', icon: 'mail', keyboardType: 'email-address', required: true },
        { name: 'password', label: 'Password', icon: 'lock-closed', secure: true, required: true },
        { name: 'confirmPassword', label: 'Confirm Password', icon: 'lock-closed', secure: true, required: true },
      ]
    },
    {
      title: "Personal Information",
      fields: [
        { name: 'first_name', label: 'First Name', icon: 'person', required: true },
        { name: 'middle_name', label: 'Middle Name', icon: 'person' },
        { name: 'last_name', label: 'Last Name', icon: 'person', required: true },
        { name: 'severity', label: 'Disability Severity', icon: 'accessibility', type: 'select', required: true },
        { name: 'monthly_income', label: 'Monthly Income', icon: 'cash', type: 'select', required: true },
        { name: 'dependent', label: 'Number of Dependents', icon: 'people', keyboardType: 'numeric' },
        { name: 'birthdate', label: 'Birthdate', icon: 'calendar', type: 'date', required: true },
        { name: 'sex', label: 'Gender', icon: 'male-female', type: 'radio', required: true },
        { name: 'contact_number', label: 'Contact Number', icon: 'call', keyboardType: 'phone-pad' },
        { name: 'address', label: 'Address', icon: 'home', required: true },
        { name: 'barangay', label: 'Barangay', icon: 'location', type: 'select', required: true },
      ]
    },
    {
      title: "Additional Information",
      fields: [
        { name: 'id_number', label: 'ID Number', icon: 'card' },
        { name: 'disability_type', label: 'Disability Type', icon: 'accessibility', type: 'select' },
        { name: 'blood_type', label: 'Blood Type', icon: 'water', type: 'select' },
        { name: 'sss_number', label: 'SSS Number', icon: 'document' },
        { name: 'philhealth_number', label: 'PhilHealth Number', icon: 'medical' },
      ]
    },
    {
      title: "Guardian Information",
      fields: [
        { name: 'guardian_full_name', label: 'Guardian Full Name', icon: 'people' },
        { name: 'guardian_relationship', label: 'Relationship', icon: 'heart', type: 'select' },
        { name: 'guardian_contact_number', label: 'Guardian Contact', icon: 'call', keyboardType: 'phone-pad' },
        { name: 'guardian_address', label: 'Guardian Address', icon: 'home' },
      ]
    },
    {
      title: "Documents Upload",
      fields: [
        { name: 'barangay_indigency', label: 'Barangay Indigency', icon: 'document', type: 'image', required: true },
        { name: 'medical_certificate', label: 'Medical Certificate', icon: 'medical', type: 'image' },
        { name: 'picture_2x2', label: '2x2 Picture', icon: 'camera', type: 'image' },
        { name: 'birth_certificate', label: 'Birth Certificate', icon: 'document', type: 'image' },
        { name: 'remarks', label: 'Remarks', icon: 'chatbubble', multiline: true },
      ]
    }
  ];

  const renderField = (field) => {
    switch (field.type) {
      case 'date':
        return (
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name={field.icon} size={22} color="#6b7280" style={styles.inputIcon} />
            <Text style={styles.dateText}>
              {form[field.name] ? form[field.name].toLocaleDateString() : 'Select Birthdate'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        );

      case 'radio':
        return (
          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>Gender *</Text>
            <View style={styles.radioOptions}>
              {['male', 'female', 'other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => handleChange('sex', option)}
                >
                  <View style={[
                    styles.radioCircle,
                    form.sex === option && styles.radioCircleSelected
                  ]}>
                    {form.sex === option && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={styles.radioText}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'select':
        return (
          <View style={styles.selectField}>
            <Text style={styles.selectLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => openDropdown(field.name, field.label)}
            >
              <Ionicons name={field.icon} size={22} color="#6b7280" style={styles.inputIcon} />
              <Text style={[
                styles.selectInputText,
                !form[field.name] && styles.selectInputPlaceholder
              ]}>
                {getDisplayValue(field.name, form[field.name])}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        );

      case 'image':
        const document = documents[field.name];
        return (
          <TouchableOpacity
            style={styles.documentButton}
            onPress={() => handleDocumentPick(field.name)}
          >
            <Ionicons
              name={document ? "checkmark-circle" : field.icon}
              size={24}
              color={document ? "#10b981" : field.required ? "#ef4444" : "#2563eb"}
            />
            <View style={styles.documentInfo}>
              <Text style={styles.documentLabel}>
                {field.label}{field.required ? ' *' : ''}
              </Text>
              <Text style={[
                styles.documentStatus,
                field.required && !document && styles.documentRequired
              ]}>
                {document ? "Uploaded" : field.required ? "Required - Tap to upload" : "Tap to upload"}
                {field.name === 'barangay_indigency' && !document && " (JPG, JPEG, PNG, PDF)"}
              </Text>
            </View>
            <Ionicons name="cloud-upload" size={20} color="#6b7280" />
          </TouchableOpacity>
        );

      default:
        return (
          <TextInput
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={form[field.name]}
            onChangeText={(text) => handleChange(field.name, text)}
            mode="outlined"
            style={styles.input}
            secureTextEntry={field.secure}
            keyboardType={field.keyboardType}
            multiline={field.multiline}
            numberOfLines={field.multiline ? 3 : 1}
            left={
              <TextInput.Icon
                icon={() => (
                  <Ionicons name={field.icon} size={22} color="#6b7280" />
                )}
              />
            }
            theme={theme}
          />
        );
    }
  };

  const currentSectionData = sections[currentSection];

  // Fixed Progress Step Component
  const ProgressStep = ({ index, currentSection }) => {
    const isCompleted = index < currentSection;
    const isActive = index <= currentSection;

    return (
      <View style={styles.stepContainer}>
        <View style={[
          styles.step,
          isActive && styles.stepActive,
          isCompleted && styles.stepCompleted
        ]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color="#fff" />
          ) : (
            <Text style={[
              styles.stepNumber,
              isActive && styles.stepNumberActive
            ]}>
              {index + 1}
            </Text>
          )}
        </View>
        {index < sections.length - 1 && (
          <View style={[
            styles.stepLine,
            index < currentSection && styles.stepLineActive
          ]} />
        )}
      </View>
    );
  };

  return (
    <PaperProvider theme={theme}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={["#667eea", "#764ba2", "#667eea"]}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join our community</Text>
              </View>

              {/* Progress Steps - FIXED */}
              <View style={styles.progressContainer}>
                {sections.map((_, index) => (
                  <ProgressStep
                    key={index}
                    index={index}
                    currentSection={currentSection}
                  />
                ))}
              </View>

              {/* Form Section */}
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>{currentSectionData.title}</Text>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {currentSectionData.fields.map((field, index) => (
                  <View key={field.name} style={styles.fieldContainer}>
                    {renderField(field)}
                  </View>
                ))}

                {/* Navigation Buttons */}
                <View style={styles.navigationButtons}>
                  {currentSection > 0 && (
                    <TouchableOpacity
                      style={styles.prevButton}
                      onPress={() => {
                        setCurrentSection(prev => prev - 1);
                        setError("");
                      }}
                    >
                      <Text style={styles.prevButtonText}>Previous</Text>
                    </TouchableOpacity>
                  )}

                  {currentSection < sections.length - 1 ? (
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleNext}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleRegister}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.submitButtonText}>Create Account</Text>
                          <Ionicons name="checkmark" size={20} color="#fff" />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.loginLink}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginLinkText}>Sign in</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Dropdown Modal */}
          <DropdownModal />

          {showDatePicker && (
            <DateTimePicker
              value={form.birthdate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

// ... (keep all the existing styles exactly as they were)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#fff',
  },
  stepCompleted: {
    backgroundColor: '#10b981',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stepNumberActive: {
    color: '#2563eb',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#fff',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  radioOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  radioInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  radioText: {
    fontSize: 14,
    color: '#374151',
  },
  selectField: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    height: 56,
  },
  selectInputText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  selectInputPlaceholder: {
    color: '#6b7280',
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  documentRequired: {
    color: '#ef4444',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  prevButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  loginText: {
    color: '#6b7280',
    fontSize: 15,
  },
  loginLinkText: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  optionSeparator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
  },
});

export default Register;