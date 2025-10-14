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
} from "react-native";
import { TextInput, RadioButton, Menu, Divider } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get("window");

export default function Register() {
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
    birthdate: new Date(),
    sex: "",
    contact_number: "",
    address: "",
    barangay: "",
    
    // Optional fields
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

  // Menu states for dropdowns
  const [barangayMenuVisible, setBarangayMenuVisible] = useState(false);
  const [bloodTypeMenuVisible, setBloodTypeMenuVisible] = useState(false);
  const [disabilityMenuVisible, setDisabilityMenuVisible] = useState(false);
  const [guardianRelationshipMenuVisible, setGuardianRelationshipMenuVisible] = useState(false);

  // Options matching web version
  const barangayOptions = [
    "Awang", "Bagocboc", "Barra", "Bonbon", "Cauyonan", "Igpit",
    "Limonda", "Luyong Bonbon", "Malanang", "Nangcaon", "Patag",
    "Poblacion", "Taboc", "Tingalan"
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

  const handleDocumentPick = async (type) => {
    try {
      let result;
      if (type === 'picture_2x2') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        
        if (!result.canceled) {
          setDocuments(prev => ({
            ...prev,
            [type]: {
              uri: result.assets[0].uri,
              type: 'image/jpeg',
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
          setDocuments(prev => ({
            ...prev,
            [type]: {
              uri: result.assets[0].uri,
              type: result.assets[0].mimeType,
              name: result.assets[0].name
            }
          }));
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateForm = () => {
    // Required fields validation
    const requiredFields = [
      'username', 'email', 'password', 'confirmPassword',
      'first_name', 'last_name', 'sex', 'address', 'barangay'
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

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      // User credentials
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("password", form.password);

      // Required profile fields
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("birthdate", form.birthdate.toISOString().split('T')[0]);
      formData.append("sex", form.sex);
      formData.append("address", form.address);
      formData.append("barangay", form.barangay);

      // Optional fields
      if (form.middle_name) formData.append("middle_name", form.middle_name);
      if (form.contact_number) formData.append("contact_number", form.contact_number);
      if (form.disability_type) formData.append("disability_type", form.disability_type);
      if (form.blood_type) formData.append("blood_type", form.blood_type);
      if (form.sss_number) formData.append("sss_number", form.sss_number);
      if (form.philhealth_number) formData.append("philhealth_number", form.philhealth_number);
      
      // Guardian information
      if (form.guardian_full_name) formData.append("guardian_full_name", form.guardian_full_name);
      if (form.guardian_relationship) formData.append("guardian_relationship", form.guardian_relationship);
      if (form.guardian_contact_number) formData.append("guardian_contact_number", form.guardian_contact_number);
      if (form.guardian_address) formData.append("guardian_address", form.guardian_address);
      
      // Remarks
      if (form.remarks) formData.append("remarks", form.remarks);

      // Append documents
      Object.entries(documents).forEach(([key, document]) => {
        if (document) {
          formData.append(key, document);
        }
      });

      const res = await api.post("/member/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      Alert.alert(
        "Success", 
        "Registration successful! Your account is pending approval.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]
      );
      
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message === "Network Error") {
        setError("Cannot connect to server. Check your internet connection.");
      } else {
        const errors = err.response?.data?.errors;
        setError(
          errors
            ? Object.values(errors).flat().join(', ')
            : err.response?.data?.message || "Registration failed. Please try again."
        );
      }
    }
    setLoading(false);
  };

  // Helper function to get display value for dropdowns
  const getDisplayValue = (fieldName, value) => {
    if (!value) return `Select ${fieldName.replace('_', ' ')}`;
    
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
        { name: 'barangay_indigency', label: 'Barangay Indigency', icon: 'document', type: 'document' },
        { name: 'medical_certificate', label: 'Medical Certificate', icon: 'medical', type: 'document' },
        { name: 'picture_2x2', label: '2x2 Picture', icon: 'camera', type: 'image' },
        { name: 'birth_certificate', label: 'Birth Certificate', icon: 'document', type: 'document' },
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
        const options = field.name === 'barangay' ? barangayOptions :
                        field.name === 'blood_type' ? bloodTypeOptions :
                        field.name === 'disability_type' ? disabilityTypeOptions :
                        guardianRelationshipOptions;

        const isVisible = field.name === 'barangay' ? barangayMenuVisible :
                          field.name === 'blood_type' ? bloodTypeMenuVisible :
                          field.name === 'disability_type' ? disabilityMenuVisible :
                          guardianRelationshipMenuVisible;

        const setVisible = (visible) => {
          if (field.name === 'barangay') setBarangayMenuVisible(visible);
          else if (field.name === 'blood_type') setBloodTypeMenuVisible(visible);
          else if (field.name === 'disability_type') setDisabilityMenuVisible(visible);
          else setGuardianRelationshipMenuVisible(visible);
        };

        return (
          <View style={styles.selectField}>
            <Text style={styles.selectLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <Menu
              visible={isVisible}
              onDismiss={() => setVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setVisible(true)}
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
              }
              style={styles.menu}
            >
              {options.map((option, index) => (
                <React.Fragment key={option.value || option}>
                  <Menu.Item
                    onPress={() => {
                      handleChange(field.name, option.value || option);
                      setVisible(false);
                    }}
                    title={option.label || option}
                    titleStyle={styles.menuItemText}
                  />
                  {index < options.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Menu>
          </View>
        );

      case 'document':
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
              color={document ? "#10b981" : "#2563eb"} 
            />
            <View style={styles.documentInfo}>
              <Text style={styles.documentLabel}>
                {field.label}
              </Text>
              <Text style={styles.documentStatus}>
                {document ? "Uploaded" : "Tap to upload"}
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
            theme={{
              colors: {
                primary: '#2563eb',
                background: 'transparent',
              },
              roundness: 12,
            }}
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
                    onPress={() => setCurrentSection(prev => prev - 1)}
                  >
                    <Text style={styles.prevButtonText}>Previous</Text>
                  </TouchableOpacity>
                )}
                
                {currentSection < sections.length - 1 ? (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={() => setCurrentSection(prev => prev + 1)}
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
  );
}

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
  menu: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
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
});