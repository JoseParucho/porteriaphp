import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import funcionariosData from '../../assets/funcionarios.json';
import Header from '../../components/header';
import {
  loadFuncionarios,
  loadRegistroDiario,
  saveFuncionarios,
  saveRegistroDiario,
  setRegistroDiario,
} from '../../storage';

export default function FuncionariosScreen() {
  const router = useRouter();
  const route = useRoute();

  const [busqueda, setBusqueda] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRut, setNuevoRut] = useState('');
  const [nuevaPatente, setNuevaPatente] = useState('');
  const [patenteEditable, setPatenteEditable] = useState('');
  const [editarPatenteVisible, setEditarPatenteVisible] = useState(false);

  // Estado para controlar apertura modal desde parámetro QR solo 1 vez
  const [modalAbiertoDesdeQR, setModalAbiertoDesdeQR] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const cargarFuncionarios = async () => {
        try {
          const existentes = await loadFuncionarios();
          if (existentes && existentes.length > 0) {
            setFuncionarios(existentes);
          } else {
            await saveFuncionarios(funcionariosData);
            setFuncionarios(funcionariosData);
          }
        } catch (error) {
          console.error('Error al cargar funcionarios:', error);
          Alert.alert('Error', 'No se pudo cargar la lista de funcionarios.');
        }
      };

      cargarFuncionarios();
      setBusqueda('');
      setModalAgregarVisible(false);
      setEditarPatenteVisible(false);
      setModalVisible(false);
      setSeleccionado(null);
      setModalAbiertoDesdeQR(false);
    }, [])
  );

  // Abrir modal si viene parámetro 'funcionario' y no se ha abierto aún
  useEffect(() => {
    if (route.params?.funcionario && !modalAbiertoDesdeQR) {
      try {
        const funcObj = JSON.parse(route.params.funcionario);
        setSeleccionado(funcObj);
        setPatenteEditable(funcObj.patente || '');
        setEditarPatenteVisible(false);
        setModalVisible(true);
        setModalAbiertoDesdeQR(true);
      } catch (e) {
        console.error('Error parsing funcionario param:', e);
      }
    }
  }, [route.params, modalAbiertoDesdeQR]);

  const eliminarFuncionario = async () => {
    if (!seleccionado) return;

    Alert.alert(
      '¿Eliminar funcionario?',
      `¿Estás seguro de que deseas eliminar a ${seleccionado.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const actualizados = funcionarios.filter(f => f.nombre !== seleccionado.nombre);
              setFuncionarios(actualizados);
              await saveFuncionarios(actualizados);
              setModalVisible(false);
              setSeleccionado(null);
              Alert.alert('✅ Eliminado', 'Funcionario eliminado correctamente.');
            } catch (e) {
              console.error('Error al eliminar funcionario:', e);
              Alert.alert('Error', 'No se pudo eliminar el funcionario.');
            }
          },
        },
      ]
    );
  };

  const registrar = async tipo => {
    try {
      const ahora = new Date();
      const fechaActual = ahora.toISOString().split('T')[0];
      const registros = (await loadRegistroDiario()) || [];

      const existente = registros.find(
        r =>
          r.tipo === 'funcionario' &&
          r.nombre === seleccionado.nombre &&
          r.fecha.startsWith(fechaActual)
      );

      if (tipo === 'entrada') {
        const nuevo = {
          id: uuid.v4(),
          tipo: 'funcionario',
          nombre: seleccionado.nombre,
          rut: seleccionado.rut,
          fecha: ahora.toISOString(),
          entrada: ahora.toLocaleTimeString(),
          salida: '',
          motivo: 'Ingreso al establecimiento',
          matricula: seleccionado.patente,
        };

        await saveRegistroDiario(nuevo);
        Alert.alert('✅ Entrada registrada', `Entrada de ${seleccionado.nombre} registrada.`);
      } else {
        if (!existente) {
          Alert.alert('❌ No hay entrada previa', 'Primero debes registrar la entrada.');
          return;
        }

        const actualizado = registros.map(r => {
          if (r.id === existente.id) {
            return {
              ...r,
              salida: ahora.toLocaleTimeString(),
              motivo: 'Salida del establecimiento',
            };
          }
          return r;
        });

        await setRegistroDiario(actualizado);
        Alert.alert('✅ Salida registrada', `Salida de ${seleccionado.nombre} registrada.`);
      }

      setModalVisible(false);
      setSeleccionado(null);
      setBusqueda('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo registrar la hora.');
    }
  };

  const formatearPatente = texto => {
    const limpio = texto.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    const secciones = limpio.match(/.{1,2}/g) || [];
    return secciones.join('-');
  };

  const guardarNuevaPatente = async () => {
    try {
      const nueva = formatearPatente(patenteEditable);
      const actualizados = funcionarios.map(f => {
        if (f.nombre === seleccionado.nombre) {
          return { ...f, patente: nueva };
        }
        return f;
      });

      setFuncionarios(actualizados);
      await saveFuncionarios(actualizados);
      setSeleccionado({ ...seleccionado, patente: nueva });
      setEditarPatenteVisible(false);
      Alert.alert('✅ Patente actualizada', 'Se guardó la nueva patente.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo actualizar la patente.');
    }
  };

  const agregarFuncionario = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Nombre requerido', 'Debes ingresar el nombre del funcionario.');
      return;
    }

    if (!nuevoRut.trim()) {
      Alert.alert('RUT requerido', 'Debes ingresar el RUT del funcionario.');
      return;
    }

    const yaExiste = funcionarios.find(
      f =>
        f.nombre.trim().toLowerCase() === nuevoNombre.trim().toLowerCase() ||
        f.rut.trim().toLowerCase() === nuevoRut.trim().toLowerCase()
    );

    if (yaExiste) {
      Alert.alert('Funcionario duplicado', 'Ya existe un funcionario con ese nombre o RUT.');
      return;
    }

    const nuevo = {
      nombre: nuevoNombre.trim(),
      rut: nuevoRut.trim(),
      patente: formatearPatente(nuevaPatente.trim()),
    };

    const actualizado = [...funcionarios, nuevo];
    await saveFuncionarios(actualizado);
    setFuncionarios(actualizado);

    setNuevoNombre('');
    setNuevoRut('');
    setNuevaPatente('');
    setModalAgregarVisible(false);
    Alert.alert('✅ Funcionario agregado', 'El funcionario fue agregado correctamente.');
  };

  const filtrados = funcionarios.filter(f => {
    const query = busqueda.toLowerCase();
    return (
      f.nombre?.toLowerCase().includes(query) ||
      f.rut?.toLowerCase().includes(query) ||
      f.codigo?.toLowerCase().includes(query) ||
      f.patente?.replace(/-/g, '').toLowerCase().includes(query.replace(/-/g, ''))
    );
  });

  return (
    <View style={styles.container}>
      <Header title="Funcionarios" />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <TouchableOpacity
          style={[styles.agregarButton, { flex: 1 }]}
          onPress={() => setModalAgregarVisible(true)}
        >
          <Text style={styles.buttonText}>➕ Agregar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.agregarButton, { flex: 1, backgroundColor: '#00796B' }]}
          onPress={() => router.push('/QrScanner')}
        >
          <Text style={styles.buttonText}>📷 Escanear QR</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Buscar por nombre, RUT o patente"
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
              setSeleccionado(item);
              setPatenteEditable(item.patente || '');
              setEditarPatenteVisible(false);
              setModalVisible(true);
            }}
          >
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.patente}>RUT: {item.rut}</Text>
            <Text style={styles.patente}>Código: {item.codigo}</Text>
            <Text style={styles.patente}>Patente: {item.patente}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          busqueda.length > 0 ? (
            <Text style={styles.empty}>No se encontraron funcionarios.</Text>
          ) : null
        }
      />

      {/* Modal Registro */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Registrar hora para: {seleccionado?.nombre}</Text>

            {editarPatenteVisible ? (
              <>
                <TextInput
                  placeholder="Editar patente"
                  value={patenteEditable}
                  onChangeText={text => setPatenteEditable(formatearPatente(text))}
                  style={styles.searchInput}
                />
                <TouchableOpacity style={styles.guardarButton} onPress={guardarNuevaPatente}>
                  <Text style={styles.buttonText}>Guardar patente</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.guardarButton}
                onPress={() => setEditarPatenteVisible(true)}
              >
                <Text style={styles.buttonText}>✏️ Editar patente</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => registrar('entrada')}
              >
                <Text style={styles.buttonText}>Registrar Entrada</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => registrar('salida')}
              >
                <Text style={styles.buttonText}>Registrar Salida</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: '#B71C1C' }]}
                onPress={eliminarFuncionario}
              >
                <Text style={styles.buttonText}>🗑️ Eliminar funcionario</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setSeleccionado(null);
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Agregar Funcionario */}
      <Modal visible={modalAgregarVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Agregar Funcionario</Text>

            <TextInput
              placeholder="Nombre del funcionario"
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              style={styles.searchInput}
            />

            <TextInput
              placeholder="RUT del funcionario"
              value={nuevoRut}
              onChangeText={setNuevoRut}
              style={styles.searchInput}
            />

            <TextInput
              placeholder="Patente del auto (opcional)"
              value={nuevaPatente}
              onChangeText={text => setNuevaPatente(formatearPatente(text))}
              style={styles.searchInput}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={agregarFuncionario}>
                <Text style={styles.buttonText}>Agregar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNuevoNombre('');
                  setNuevoRut('');
                  setNuevaPatente('');
                  setModalAgregarVisible(false);
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
  container: { flex: 1, padding: 20, backgroundColor: '#C8E6C9' },
  searchInput: {
    backgroundColor: '#fff',
    padding: 16,
    fontSize: 18,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#AED581',
  },
  agregarButton: {
    backgroundColor: '#43A047',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#558B2F',
  },
  nombre: { fontSize: 20, fontWeight: 'bold', color: '#33691E' },
  patente: { fontSize: 20, color: '#4E342E' },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    width: '100%',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#33691E',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  confirmButton: {
    backgroundColor: '#689F38',
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  cancelButton: {
    backgroundColor: '#E53935',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  guardarButton: {
    backgroundColor: '#388E3C',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
});
