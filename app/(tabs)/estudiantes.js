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
import apoderadosData from '../../assets/apoderados.json';
import estudiantesData from '../../assets/estudiantes.json';
import Header from '../../components/header';
import {
  loadRegistroDiario,
  saveEstudiantes,
  saveRegistroDiario,
  setRegistroDiario
} from '../../storage';

export default function EstudiantesScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [modoBusqueda, setModoBusqueda] = useState('nombre_rut');
  const [modalAcompananteVisible, setModalAcompananteVisible] = useState(false);
const [tipoAcompanante, setTipoAcompanante] = useState(null);
const [busquedaAcompanante, setBusquedaAcompanante] = useState('');
const [apoderados, setApoderados] = useState([]);
const [acompananteSeleccionado, setAcompananteSeleccionado] = useState(null);

  const obtenerRut = (obj) => {
    if (!obj) return '';
    const claveRut = Object.keys(obj).find((key) => key.toLowerCase() === 'rut');
    return claveRut ? obj[claveRut] : '';
  };

useFocusEffect(
  useCallback(() => {
    const cargar = async () => {
      try {
        // Siempre cargar estudiantes desde el JSON (sobrescribe los guardados)
        await saveEstudiantes(estudiantesData);
        setEstudiantes(estudiantesData);

        // Siempre cargar apoderados desde el JSON y normalizar
        const apoderadosNormalizados = apoderadosData.map((a) => ({
          nombre: a.nombreApoderado || 'Sin nombre',
          rut: a.rutApoderado || '',
          alumno: a.nombreAlumno || '',
          curso: a.curso || '',
          modalidad: a.Modalidad || '',
        }));
        setApoderados(apoderadosNormalizados);

        // Reset de estados
        setAcompananteSeleccionado('');
        setBusqueda('');
        setSeleccionado(null);
        setModalVisible(false);
        setModoBusqueda('nombre_rut');
      } catch (e) {
        console.error('Error al cargar datos:', e);
        Alert.alert('Error', 'No se pudo cargar la lista de estudiantes o apoderados.');
      }
    };
    cargar();
  }, [])
);


  const normalizar = (texto) =>
    texto?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtrados = estudiantes.filter((e) => {
    const nombreAlumno = normalizar(e.nombreAlumno || '');
    const rutAlumno = normalizar(obtenerRut(e));
    const codigoAlumno = normalizar(e.codigo || '');
    const terminoBusqueda = normalizar(busqueda.trim());

    if (modoBusqueda === 'codigo') {
      return codigoAlumno.includes(terminoBusqueda);
    }

    const palabrasAlumno = nombreAlumno.split(/\s|,/).filter(Boolean);
    const palabrasBusqueda = terminoBusqueda.split(/\s/).filter(Boolean);

    return (
      palabrasBusqueda.every((palabra) =>
        palabrasAlumno.some((palabraAlumno) => palabraAlumno.includes(palabra))
      ) || rutAlumno.includes(terminoBusqueda)
    );
  });

 const registrar = async (tipo) => {
  try {
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const registros = (await loadRegistroDiario()) || [];

    const existente = registros.find(
      (r) =>
        r.tipo === 'estudiante' &&
        r.nombre === seleccionado.nombreAlumno &&
        r.fecha.startsWith(fechaActual) &&
        !r.salida
    );

    if (tipo === 'entrada') {
      if (existente) {
        Alert.alert('Ya hay una entrada registrada sin salida.');
        return;
      }

      const nuevo = {
        id: uuid.v4(),
        tipo: 'estudiante',
        nombre: seleccionado.nombreAlumno,
        fecha: ahora.toISOString(),
        entrada: ahora.toLocaleTimeString(),
        salida: '',
        motivo: 'Ingreso al establecimiento',
        curso: seleccionado.curso,
        modalidad: seleccionado.Modalidad || '',
        rut: obtenerRut(seleccionado),
        acompanante: acompananteSeleccionado || '',
      };

      await saveRegistroDiario(nuevo);
      Alert.alert('✅ Entrada registrada', `Entrada de ${seleccionado.nombreAlumno} registrada.`);
    } else if (tipo === 'salida') {
      if (!existente) {
        // ✅ Permitir salida sin entrada previa
        const nuevo = {
          id: uuid.v4(),
          tipo: 'estudiante',
          nombre: seleccionado.nombreAlumno,
          fecha: ahora.toISOString(),
          entrada: 'Bus escolar',
          salida: ahora.toLocaleTimeString(),
          motivo: 'Salida del establecimiento',
          curso: seleccionado.curso,
          modalidad: seleccionado.Modalidad || '',
          rut: obtenerRut(seleccionado),
          acompanante: acompananteSeleccionado || '',
        };

        await saveRegistroDiario(nuevo);
        Alert.alert('✅ Salida registrada', `Salida de ${seleccionado.nombreAlumno} registrada.`);
      } else {
       const actualizado = registros.map((r) =>
  r.id === existente.id
    ? {
        ...r,
        salida: ahora.toLocaleTimeString(),
        motivo: 'Salida del establecimiento',
        acompanante: acompananteSeleccionado || r.acompanante || '',
      }
    : r
);

        await setRegistroDiario(actualizado);
        Alert.alert('✅ Salida registrada', `Salida de ${seleccionado.nombreAlumno} registrada.`);
      }
    } else if (tipo === 'salida_urgencia') {
      const nuevo = {
        id: uuid.v4(),
        tipo: 'estudiante',
        nombre: seleccionado.nombreAlumno,
        fecha: ahora.toISOString(),
        entrada: '',
        salida: ahora.toLocaleTimeString(),
        motivo: 'Salida de urgencia',
        curso: seleccionado.curso,
        modalidad: seleccionado.Modalidad || '',
        rut: obtenerRut(seleccionado),
      };

      await saveRegistroDiario(nuevo);
      Alert.alert(
        '🚨 Salida de urgencia registrada',
        `Salida de urgencia de ${seleccionado.nombreAlumno}.`
      );
    }

    setModalVisible(false);
    setSeleccionado(null);
    setBusqueda('');
  } catch (e) {
    console.error(`Error al registrar ${tipo}:`, e);
    Alert.alert('Error', `No se pudo registrar la ${tipo.replace('_', ' ')}.\n${e.message}`);
  }
};

  return (
  <View style={styles.container}>
    <Header title="Estudiantes" />

    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>Buscar por:</Text>
      <Picker
        selectedValue={modoBusqueda}
        onValueChange={(itemValue) => setModoBusqueda(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Nombre / RUT" value="nombre_rut" />
        <Picker.Item label="Código" value="codigo" />
      </Picker>
    </View>

    <TextInput
      placeholder={
        modoBusqueda === 'codigo'
          ? 'Buscar por código'
          : 'Buscar estudiante por nombre o RUT'
      }
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
            setModalVisible(true);
          }}
        >
          <Text style={styles.nombre}>{item.nombreAlumno}</Text>
          <Text style={styles.info}>Código: {item.codigo}</Text>
          <Text style={styles.info}>RUT: {obtenerRut(item)}</Text>
          <Text style={styles.info}>Curso: {item.curso}</Text>
          {item.Modalidad && (
            <Text style={styles.info}>Modalidad: {item.Modalidad}</Text>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        busqueda.length > 0 ? (
          <Text style={styles.empty}>No se encontraron estudiantes.</Text>
        ) : null
      }
    />

    {/* Modal principal */}
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            ¿Registrar a {seleccionado?.nombreAlumno}?
          </Text>
          {acompananteSeleccionado && (
  <Text style={styles.acompananteResumen}>
    Acompañante: {acompananteSeleccionado}
  </Text>
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
          </View>

          <TouchableOpacity
            style={styles.urgenciaButton}
            onPress={() => registrar('salida_urgencia')}
          >
            <Text style={styles.buttonText}>Salida de Urgencia</Text>
          </TouchableOpacity>

          {/* Botón acompañante separado */}
          <TouchableOpacity
            style={styles.acompananteButton}
            onPress={() => setModalAcompananteVisible(true)}
          >
            <Text style={styles.buttonText}>
              agregar acompañante
            </Text>
          </TouchableOpacity>

          {/* Botón cancelar */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setModalVisible(false);
              setSeleccionado(null);
               setAcompananteSeleccionado(null);
            }}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Modal de acompañante */}
    <Modal visible={modalAcompananteVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Selecciona el tipo de acompañante</Text>

          <TouchableOpacity
  style={styles.acompananteTipoButton} // nuevo estilo aquí
  onPress={() => setTipoAcompanante('apoderado')}
>
  <Text style={styles.buttonText}>Apoderado</Text>
</TouchableOpacity>

          <TouchableOpacity
  style={styles.acompananteTipoButton} // nuevo estilo aquí
  onPress={() => setTipoAcompanante('otro')}
>
  <Text style={styles.buttonText}>Otro</Text>
</TouchableOpacity>

          {tipoAcompanante === 'apoderado' && (
            <>
              <TextInput
                placeholder="Buscar apoderado por nombre o RUT"
                value={busquedaAcompanante}
                onChangeText={setBusquedaAcompanante}
                style={styles.searchInput}
              />
              <FlatList
                data={apoderados.filter((a) =>
                  normalizar(a.nombre + obtenerRut(a)).includes(normalizar(busquedaAcompanante))
                )}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => {
                      setAcompananteSeleccionado(`${item.nombre} (${obtenerRut(item)})`);
                      setModalAcompananteVisible(false);
                      setTipoAcompanante(null);
                      setBusquedaAcompanante('');
                    }}
                  >
                    <Text style={styles.nombre}>{item.nombre}</Text>
                    <Text style={styles.info}>RUT: {obtenerRut(item)}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
              />
            </>
          )}

          {tipoAcompanante === 'otro' && (
            <>
              <TextInput
                placeholder="Nombre o RUT del acompañante"
                value={busquedaAcompanante}
                onChangeText={setBusquedaAcompanante}
                style={styles.searchInput}
              />
              <TouchableOpacity
                style={styles.acompananteTipoButton}
                onPress={() => {
                  setAcompananteSeleccionado(busquedaAcompanante);
                  setModalAcompananteVisible(false);
                  setTipoAcompanante(null);
                  setBusquedaAcompanante('');
                }}
              >
                <Text style={styles.buttonText}>Guardar Acompañante</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setModalAcompananteVisible(false);
              setTipoAcompanante(null);
              setBusquedaAcompanante('');
            }}
          >
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#E8F5E9' },
  searchInput: {
    backgroundColor: '#fff',
    padding: 16,
    fontSize: 18,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#AED581',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  picker: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#AED581',
    borderWidth: 1,
    borderRadius: 8,
    height: 50,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 6,
    borderLeftColor: '#43A047',
  },
  nombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  info: {
    fontSize: 18,
    color: '#4E342E',
  },
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
    color: '#2E7D32',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#43A047',
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#E53935',
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  urgenciaButton: {
    backgroundColor: '#F57C00',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  acompananteButton: {
  backgroundColor: '#1976D2',
  padding: 14,
  borderRadius: 8,
  marginBottom: 12,
},
acompananteTipoButton: {
  backgroundColor: '#43A047',
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderRadius: 8,
  marginBottom: 12,
  alignItems: 'center',
},
acompananteResumen: {
  fontSize: 16,
  color: '#555',
  textAlign: 'center',
  marginBottom: 12,
},


});
