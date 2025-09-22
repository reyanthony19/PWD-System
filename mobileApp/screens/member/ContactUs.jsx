import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContactUs() {
  return (
    <LinearGradient
      colors={['#6ee7b7', '#2563eb']} // Your desired gradient
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Image */}
        <Image
          source={require('@/assets/images/pdao.jpg')} // Update the path if needed
          style={styles.image}
        />

        <Text style={styles.title}>Contact Us</Text>

        <Text style={styles.address}>
          NCDA Building, Isidora Street, Barangay Holy Spirit, Diliman, Quezon City, Philippines 1127
        </Text>

        <Text style={styles.contactDetailsTitle}>You may also reach us at:</Text>
        <Text style={styles.contactDetails}>
          Telephone No: (632) 5310-4759; (632) 5310-4760; (632) 5310-4761; (632) 5310-4762; (632) 5310-4763; (632) 8932-3663; (632) 8932-6422
        </Text>

        <Text style={styles.email}>Email: council@ncda.gov.ph</Text>
        <Text style={styles.facebook}>Facebook: National Council on Disability Affairs</Text>

        <Text style={styles.positionTitle}>Heads and Contact Details:</Text>
        <View style={styles.contactTable}>
          {[{ head: 'REX T. GATCHALIAN', position: 'Chairperson-NCDA / DSWD Secretary', contact: 'Trunklines (632) 8931-81-01 to 07 Local: 301, 300, 302, 303 Tel/Fax: (632) 8931-81-91' },
          { head: 'GLENDA D. RELOVA', position: 'Executive Director', contact: 'Extension No. 101 / Tel. No.: (632) 8932-3663' },
          { head: 'DANDY C. VICTA', position: 'Concurrent OIC Deputy Executive Director', contact: 'Extension No. 110 and 111' },
          { head: 'EXEQUIEL A. FRANCISCO', position: 'Division Chief, Finance and Administrative Division (FAD)', contact: 'Extension No. 103 and 104' },
          { head: 'RANDY D. CALSENA', position: 'OIC Division Chief, Programs Management Division (PMD)', contact: 'Extension No. 108 and 109' },
          { head: 'MARK ANTHONY B. INOCENCIO', position: 'Division Chief, Information Education and Communication Division (IECD)', contact: 'Extension No. 105 and 106' },
          { head: 'DANDY C. VICTA', position: 'Division Chief, Technical Cooperation Division (TCD)', contact: 'Extension No. 110 and 111' },
          { head: 'NCDA Lobby', position: '', contact: 'Extension No. 100 / Tel. No.: (632) 8932-6422' }
          ].map((item, index) => (
            <View key={index} style={styles.contactRow}>
              <Text style={styles.contactHead}>{item.head}</Text>
              <Text style={styles.contactPosition}>{item.position}</Text>
              <Text style={styles.contactDetailsText}>{item.contact}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 20 },
  image: { width: '100%', height: 200, resizeMode: 'contain', marginBottom: 20 },
  address: { fontSize: 16, color: '#fff', textAlign: 'center', marginBottom: 20 },
  contactDetailsTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  contactDetails: { fontSize: 16, color: '#fff', marginBottom: 10 },
  email: { fontSize: 16, color: '#fff', marginBottom: 10 },
  facebook: { fontSize: 16, color: '#fff', marginBottom: 20 },
  positionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  contactTable: { marginBottom: 20 },
  contactRow: { marginBottom: 10 },
  contactHead: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  contactPosition: { fontSize: 14, color: '#fff', fontStyle: 'italic' },
  contactDetailsText: { fontSize: 14, color: '#fff' },
});
