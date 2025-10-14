import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  Linking 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ContactUs({ navigation }) {
  const contactHeads = [
    { 
      head: 'REX T. GATCHALIAN', 
      position: 'Chairperson-NCDA / DSWD Secretary', 
      contact: 'Trunklines (632) 8931-81-01 to 07 Local: 301, 300, 302, 303 Tel/Fax: (632) 8931-81-91',
      icon: 'person'
    },
    { 
      head: 'GLENDA D. RELOVA', 
      position: 'Executive Director', 
      contact: 'Extension No. 101 / Tel. No.: (632) 8932-3663',
      icon: 'person'
    },
    { 
      head: 'DANDY C. VICTA', 
      position: 'Concurrent OIC Deputy Executive Director', 
      contact: 'Extension No. 110 and 111',
      icon: 'person'
    },
    { 
      head: 'EXEQUIEL A. FRANCISCO', 
      position: 'Division Chief, Finance and Administrative Division (FAD)', 
      contact: 'Extension No. 103 and 104',
      icon: 'business'
    },
    { 
      head: 'RANDY D. CALSENA', 
      position: 'OIC Division Chief, Programs Management Division (PMD)', 
      contact: 'Extension No. 108 and 109',
      icon: 'clipboard'
    },
    { 
      head: 'MARK ANTHONY B. INOCENCIO', 
      position: 'Division Chief, Information Education and Communication Division (IECD)', 
      contact: 'Extension No. 105 and 106',
      icon: 'megaphone'
    },
    { 
      head: 'DANDY C. VICTA', 
      position: 'Division Chief, Technical Cooperation Division (TCD)', 
      contact: 'Extension No. 110 and 111',
      icon: 'handshake'
    },
    { 
      head: 'NCDA Lobby', 
      position: '', 
      contact: 'Extension No. 100 / Tel. No.: (632) 8932-6422',
      icon: 'call'
    }
  ];

  const handleCall = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:council@ncda.gov.ph');
  };

  const handleFacebook = () => {
    Linking.openURL('https://facebook.com/National-Council-on-Disability-Affairs');
  };

  const handleAddressPress = () => {
    const address = "NCDA Building, Isidora Street, Barangay Holy Spirit, Diliman, Quezon City, Philippines 1127";
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#667eea']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.subtitle}>Get in touch with PDAO</Text>
          </View>

          {/* Office Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/pdao.jpg')}
              style={styles.image}
            />
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="office-building" size={40} color="#fff" />
              <Text style={styles.imageText}>PDAO Office</Text>
            </View>
          </View>

          {/* Contact Information Cards */}
          <View style={styles.contactSection}>
            {/* Address Card */}
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={handleAddressPress}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="location" size={24} color="#2563eb" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Office Address</Text>
                <Text style={styles.contactText}>
                  NCDA Building, Isidora Street, Barangay Holy Spirit, Diliman, Quezon City, Philippines 1127
                </Text>
                <Text style={styles.contactHint}>Tap to open in maps →</Text>
              </View>
            </TouchableOpacity>

            {/* Phone Numbers Card */}
            <View style={styles.contactCard}>
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={24} color="#2563eb" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Telephone Numbers</Text>
                <Text style={styles.contactText}>
                  (632) 5310-4759 • (632) 5310-4760 • (632) 5310-4761{'\n'}
                  (632) 5310-4762 • (632) 5310-4763 • (632) 8932-3663 • (632) 8932-6422
                </Text>
              </View>
            </View>

            {/* Email Card */}
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={handleEmail}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={24} color="#2563eb" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Email Address</Text>
                <Text style={styles.contactText}>council@ncda.gov.ph</Text>
                <Text style={styles.contactHint}>Tap to send email →</Text>
              </View>
            </TouchableOpacity>

            {/* Facebook Card */}
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={handleFacebook}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="logo-facebook" size={24} color="#2563eb" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Facebook</Text>
                <Text style={styles.contactText}>National Council on Disability Affairs</Text>
                <Text style={styles.contactHint}>Tap to visit page →</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Department Heads Section */}
          <View style={styles.departmentSection}>
            <Text style={styles.sectionTitle}>Department Heads</Text>
            <Text style={styles.sectionSubtitle}>
              Contact details of key personnel
            </Text>

            {contactHeads.map((item, index) => (
              <View key={index} style={styles.departmentCard}>
                <View style={styles.departmentHeader}>
                  <View style={styles.departmentIcon}>
                    <Ionicons name={item.icon} size={20} color="#2563eb" />
                  </View>
                  <View style={styles.departmentInfo}>
                    <Text style={styles.departmentHead}>{item.head}</Text>
                    {item.position ? (
                      <Text style={styles.departmentPosition}>{item.position}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.contactDetails}>
                  <Ionicons name="call-outline" size={16} color="#6b7280" />
                  <Text style={styles.departmentContact}>{item.contact}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Operating Hours */}
          <View style={styles.hoursCard}>
            <View style={styles.hoursHeader}>
              <MaterialCommunityIcons name="clock" size={24} color="#10b981" />
              <Text style={styles.hoursTitle}>Operating Hours</Text>
            </View>
            <View style={styles.hoursContent}>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Monday - Friday</Text>
                <Text style={styles.hoursTime}>8:00 AM - 5:00 PM</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Saturday</Text>
                <Text style={styles.hoursTime}>8:00 AM - 12:00 PM</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Sunday</Text>
                <Text style={styles.hoursTime}>Closed</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <MaterialCommunityIcons name="heart" size={20} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.footerText}>
              We're here to serve you
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
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
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  contactHint: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  departmentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  departmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  departmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentHead: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  departmentPosition: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  contactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  departmentContact: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  hoursCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hoursTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  hoursContent: {
    gap: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursDay: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  hoursTime: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
});