import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import 'react-native-get-random-values';
import uuid from 'react-native-uuid';
import Header from '../../components/header';
import { saveApoderados, saveRegistroDiario } from '../../storage';

export default function ApoderadosScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [apoderados, setApoderados] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [apoderadoSeleccionado, setApoderadoSeleccionado] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [matricula, setMatricula] = useState('');

  const cargarDesdeStorage = async () => {
    try {
      const data = require('../../assets/apoderados.json');

      const filtrados = data.map(item => ({
        ...item,
        Modalidad: item.Modalidad?.trim() || null,
      }));

      await saveApoderados(filtrados);
      setApoderados(filtrados);
    } catch (error) {
      console.error('Error al cargar apoderados:', error);
      Alert.alert('Error', 'No se pudo cargar la lista de apoderados.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const reset = async () => {
        await cargarDesdeStorage();
        setBusqueda('');
        setModalVisible(false);
        setMotivo('');
        setMatricula('');
        setApoderadoSeleccionado(null);
      };
      reset();
    }, [])
  );

  const filtrados = apoderados.filter(a =>
    (a.nombreApoderado?.toLowerCase().includes(busqueda.toLowerCase()) || false) ||
    (a.rutApoderado?.toLowerCase().includes(busqueda.toLowerCase()) || false)
  );

  const registrarIngreso = async () => {
    if (!motivo) {
      Alert.alert('Motivo requerido', 'Selecciona un motivo para registrar el ingreso.');
      return;
    }

    const ahora = new Date();
    const nuevoRegistro = {
      id: uuid.v4(),
      tipo: 'apoderado',
      nombre: apoderadoSeleccionado?.nombreApoderado,
      fecha: ahora.toISOString(),
      hora: ahora.toLocaleTimeString(),
      entrada: ahora.toLocaleTimeString(),
      salida: '',
      motivo,
      matricula: matricula.trim(),
    };

    try {
      await saveRegistroDiario(nuevoRegistro);

      await cargarDesdeStorage();
      setBusqueda('');
      setMotivo('');
      setMatricula('');
      setModalVisible(false);
      setApoderadoSeleccionado(null);

      Alert.alert('✅ Registro exitoso', 'El ingreso del apoderado fue registrado.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el ingreso. Intenta nuevamente.');
      console.error(error);
    }
  };

  const formatearPatente = (texto) => {
    const limpio = texto.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    const secciones = limpio.match(/.{1,2}/g) || [];
    return secciones.join('-');
  };

  return (
    <View style={styles.container}>
      <Header title="Buscar Apoderados" />

      <TextInput
        placeholder="Buscar por nombre o RUT"
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.searchInput}
      />

      <FlatList
        data={busqueda.length > 0 ? filtrados : []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setApoderadoSeleccionado(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.cardText}>{item.nombreApoderado}</Text>
            <Text style={styles.cardSub}>RUT: {item.rutApoderado}</Text>
            <Text style={styles.cardSub}>Alumno: {item.nombreAlumno}</Text>
            <Text style={styles.cardSub}>Curso: {item.curso || '—'}</Text>
            {item.Modalidad && typeof item.Modalidad === 'string' && item.Modalidad.trim() !== '' && (
              <Text style={styles.cardSub}>Modalidad: {item.Modalidad}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          busqueda.length > 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#333' }}>
              No se encontraron apoderados.
            </Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              ¿Registrar a {apoderadoSeleccionado?.nombreApoderado}?
            </Text>

            <Picker
              selectedValue={motivo}
              onValueChange={(itemValue) => setMotivo(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Seleccione un motivo..." value="" />
              <Picker.Item label="1. Reunión y/o entrevista" value="Reunión y/o entrevista" />
              <Picker.Item label="2. Retiro temporal de estudiante" value="Retiro temporal de estudiante" />
              <Picker.Item label="3. Entrega de materiales" value="Entrega de materiales" />
              <Picker.Item label="4. Solicitud o entrega de antecedentes" value="Solicitud o entrega de antecedentes" />
              <Picker.Item label="5. Otros" value="Otros" />
            </Picker>

            <TextInput
              placeholder="Patente del auto (opcional)"
              value={matricula}
              onChangeText={(text) => setMatricula(formatearPatente(text))}
              style={styles.input}
              maxLength={8} // XX-YY-ZZ
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={registrarIngreso}>
                <Text style={styles.buttonText}>Registrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setMotivo('');
                  setMatricula('');
                  setApoderadoSeleccionado(null);
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#A5D6A7' },
  searchInput: {
    backgroundColor: '#fff',
    padding: 40,
    fontSize: 28,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  input: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#66BB6A',
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  cardSub: {
    fontSize: 14,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E7D32',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  confirmButton: {
    backgroundColor: '#388E3C',
    padding: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#E53935',
    padding: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
});
