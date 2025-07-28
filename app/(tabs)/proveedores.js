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
import uuid from 'react-native-uuid';
import Header from '../../components/header';
import { loadProveedores, saveRegistroDiario } from '../../storage';

export default function ProveedoresScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [patente, setPatente] = useState('');

  const cargarDesdeStorage = async () => {
    const guardados = await loadProveedores();
    setProveedores(guardados);
  };

  useFocusEffect(
    useCallback(() => {
      cargarDesdeStorage();
      setBusqueda('');
      setModalVisible(false);
      setProveedorSeleccionado(null);
      setMotivo('');
      setPatente('');
    }, [])
  );

  const filtrados = proveedores.filter(p =>
    (p.empresa?.toLowerCase().includes(busqueda.toLowerCase()) || false) ||
    (p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || false)
  );

 const registrarIngreso = async () => {
  if (!motivo.trim()) {
    Alert.alert('Motivo requerido', 'Debes seleccionar un motivo.');
    return;
  }

  const ahora = new Date();

  const nuevoRegistro = {
    id: uuid.v4(),
    tipo: 'proveedor',
    nombre: `${proveedorSeleccionado.empresa} - ${proveedorSeleccionado.nombre}`,
    fecha: ahora.toISOString(),
    entrada: ahora.toLocaleTimeString(),
    motivo,
    matricula: patente,
  };

  try {
    await saveRegistroDiario(nuevoRegistro);
    await cargarDesdeStorage();
    setBusqueda('');
    setMotivo('');
    setPatente('');
    setModalVisible(false);
    setProveedorSeleccionado(null);
    Alert.alert('✅ Registro exitoso', 'El ingreso del proveedor fue registrado.');
  } catch (error) {
    Alert.alert('Error', 'No se pudo registrar el ingreso.');
    console.error(error);
  }
};

  return (
    <View style={styles.container}>
      <Header title="Buscar Proveedores" />

      <TextInput
        placeholder="Buscar por empresa o responsable"
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.searchInput}
      />

      <FlatList
        data={filtrados}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setProveedorSeleccionado(item);
              setModalVisible(true);
            }}
          >
            <Text style={styles.cardText}>{item.empresa}</Text>
            <Text style={styles.cardSub}>Responsable: {item.nombre}</Text>
            <Text style={styles.cardSub}>Días de visita: {item.dias}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          busqueda.length > 0 ? (
            <Text style={styles.emptyText}>No se encontraron proveedores.</Text>
          ) : null
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              ¿Registrar a {proveedorSeleccionado?.empresa}?
            </Text>

            <TextInput
              placeholder="Patente del auto (opcional)"
              value={patente}
              onChangeText={(text) => {
                const limpio = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                const formateado = limpio.match(/.{1,2}/g)?.join('-') || '';
                setPatente(formateado);
              }}
              style={styles.input}
            />

            <Picker
              selectedValue={motivo}
              onValueChange={(itemValue) => setMotivo(itemValue)}
              style={styles.input}
            >
              <Picker.Item label="Seleccione un motivo..." value="" />
              <Picker.Item label="Entrega o retiro de insumos" value="Entrega o retiro de insumos" />
              <Picker.Item label="Mantención o instalación" value="Mantención o instalación" />
              <Picker.Item label="Reunión" value="Reunión" />
            </Picker>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={registrarIngreso}>
                <Text style={styles.buttonText}>Registrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setMotivo('');
                  setPatente('');
                  setProveedorSeleccionado(null);
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
    padding: 25,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E7D32',
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
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#333',
    fontSize: 24,
  },
});
