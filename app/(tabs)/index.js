import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function HomeScreen() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Botón de contactos de emergencia */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.infoButton}
      >
        <Text style={styles.infoButtonText}>📞 Contactos de Emergencia</Text>
      </TouchableOpacity>

      {/* Modal de contactos */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>📋 Líderes de Equipos</Text>
              <Text>• Sr. Francisco Manqui - Director - 9 68177864</Text>
              <Text>• Sr. Cristian Pozas - Convivencia escolar - 9 15992995</Text>
              <Text>• Sr. Felipe Pacheco - Docencia - 9 42288452</Text>
              <Text>• Sr. José Astudillo - Administración y mantención - 9 84480462</Text>
              <Text>• Sra. Noelia Cifuentes - Equipo PIE - 9 93776401</Text>
              <Text>• Srta. Claudia Relma - Encargada internado - 9 44781911</Text>
              <Text>• Srta. Daniela Muñoz - Prevencionista de riesgos - 9 86118130</Text>

              <Text style={{ marginTop: 20, fontWeight: 'bold' }}>🚨 Números de Emergencia</Text>
              <Text>• Ambulancia (CESFAM Entre Lagos): 9 97431133</Text>
              <Text>• Bomberos (Entre Lagos): 64 2 371 222</Text>
              <Text>• Carabineros (Tenencia Entre Lagos): 64 2 664131</Text>
              <Text>• PDI: 134</Text>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Logo y botones */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logoi.jpg')}
          style={styles.logo}
          resizeMode="cover"
        />
      </View>

      <Text style={styles.title}>Bitacora Porteria</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/apoderados')}
      >
        <Text style={styles.buttonText}>Apoderados</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/funcionarios')}
      >
        <Text style={styles.buttonText}>Funcionarios</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/estudiantes')}
      >
        <Text style={styles.buttonText}>Estudiantes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/proveedores')}
      >
        <Text style={styles.buttonText}>Proveedores</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/visitas')}
      >
        <Text style={styles.buttonText}>Visitas Externas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonRegistro]}
        onPress={() => router.push('/(tabs)/registrodiario')}
      >
        <Text style={styles.buttonText}>📋 Ver Registro Diario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#A5D6A7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 630,
    height: 180,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#2E7D32',
    backgroundColor: '#fff',
    elevation: 6,
  },
  logo: {
    width: '100%',
    height: '90%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#388E3C',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 10,
    width: '60%',
    alignItems: 'center',
    elevation: 3,
  },
  buttonRegistro: {
    backgroundColor: '#0277BD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoButton: {
    backgroundColor: '#e16c6cff',
    padding: 16,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  infoButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    maxHeight: '80%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#E53935',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
});