import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/header';
import { loadRegistroDiario, setRegistroDiario } from '../../storage';

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';



const exportarExcel = async (datos, fechaSeleccionada, modoFiltro) => {
  if (!datos.length) {
    Alert.alert('No hay registros', 'No hay datos para exportar.');
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    let nombreFecha = 'sin_fecha';
    if (fechaSeleccionada) {
      const fecha = new Date(fechaSeleccionada);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');

      if (modoFiltro === 'semana') {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);

        const inicioStr = `${inicioSemana.getFullYear()}-${String(
          inicioSemana.getMonth() + 1
        ).padStart(2, '0')}-${String(inicioSemana.getDate()).padStart(2, '0')}`;
        const finStr = `${finSemana.getFullYear()}-${String(
          finSemana.getMonth() + 1
        ).padStart(2, '0')}-${String(finSemana.getDate()).padStart(2, '0')}`;

        nombreFecha = `semana_${inicioStr}_a_${finStr}`;
      } else {
        nombreFecha = `${year}-${month}-${day}`;
      }
    }

    const fileName = `registro_${nombreFecha}.xlsx`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Exportar a Excel',
      });
    } else {
      Alert.alert(
        'No se puede compartir',
        'Instala una app como Archivos o Google Drive para poder guardar el archivo.'
      );
    }
  } catch (error) {
    console.error('Error exportando Excel:', error);
    Alert.alert('Error', 'Ocurrió un error al exportar el archivo.');
  }
};

export default function RegistroDiarioScreen() {
  const [registros, setRegistros] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [modoFiltro, setModoFiltro] = useState('dia');
  const [busqueda, setBusqueda] = useState('');
const marcarSalida = async (id) => {
  Alert.alert(
    'Confirmar salida',
    '¿Estás seguro de que deseas marcar la salida?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, confirmar',
        onPress: async () => {
          try {
            const actual = await loadRegistroDiario();
            const ahora = new Date().toLocaleTimeString();

            const actualizado = actual.map((r) => {
              if (r.id === id && !r.salida) {
                return { ...r, salida: ahora };
              }
              return r;
            });

            await setRegistroDiario(actualizado);
            await cargarRegistros();
            Alert.alert('✅ Salida registrada', 'La hora de salida fue registrada correctamente.');
          } catch (e) {
            Alert.alert('Error', 'No se pudo registrar la salida.');
            console.error('❌ Error al marcar salida:', e);
          }
        },
      },
    ]
  );
};
const marcarReingreso = async (id) => {
  try {
    const actual = await loadRegistroDiario();
    const ahora = new Date().toLocaleTimeString();

    const actualizado = actual.map((r) => {
      if (r.id === id && !r.entrada) {
        return {
          ...r,
          entrada: ahora,
          motivo: 'salida de urgencia',
        };
      }
      return r;
    });

    await setRegistroDiario(actualizado);
    await cargarRegistros();
    Alert.alert('✅ Reingreso registrado', 'La hora de reingreso fue registrada correctamente.');
  } catch (e) {
    Alert.alert('Error', 'No se pudo registrar el reingreso.');
    console.error('❌ Error al marcar reingreso:', e);
  }
};
  const cargarRegistros = async () => {
    const data = await loadRegistroDiario();
    const ordenados = data ? [...data].reverse() : [];
    setRegistros(ordenados);
    filtrarPorFecha(ordenados, fechaSeleccionada);
  };

  useFocusEffect(
  useCallback(() => {
    const hoy = new Date();
    setFechaSeleccionada(hoy);
    setModoFiltro('dia');
    cargarRegistrosConFiltro(hoy);
  }, [])
);
const cargarRegistrosConFiltro = async (fecha) => {
  const data = await loadRegistroDiario();
  const ordenados = data ? [...data].reverse() : [];
  setRegistros(ordenados);
  filtrarPorFecha(ordenados, fecha);
};
  const filtrarPorFecha = (registros, fecha) => {
  if (!fecha) {
    setFiltrados(registros);
    return;
  }

  const fechaFiltro = new Date(fecha);
  fechaFiltro.setHours(0, 0, 0, 0);

  const filtrados = registros.filter((r) => {
    const fechaRegistro = new Date(r.fecha);
    fechaRegistro.setHours(0, 0, 0, 0);

    const coincideFecha =
      modoFiltro === 'dia'
        ? fechaRegistro.getTime() === fechaFiltro.getTime()
        : (() => {
            const inicioSemana = new Date(fechaFiltro);
            inicioSemana.setDate(fechaFiltro.getDate() - fechaFiltro.getDay());
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(inicioSemana.getDate() + 6);
            return fechaRegistro >= inicioSemana && fechaRegistro <= finSemana;
          })();

 const normalizar = (texto) =>
  texto?.toLowerCase().replace(/[^a-z0-9]/gi, '') || '';

const coincideBusqueda =
  !busqueda ||
  normalizar(r.nombre).includes(normalizar(busqueda)) ||
  normalizar(r.matricula).includes(normalizar(busqueda));
    return coincideFecha && coincideBusqueda;
  });

  setFiltrados(filtrados);
};

  const onExportar = () => {
    const agrupado = filtrados.map((r) => ({
      Fecha: new Date(r.fecha).toLocaleString(),
      Tipo: r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1),
      Nombre: r.nombre,
      Motivo: r.motivo || '—',
      Patente: r.matricula || '',
      Institución: r.institucion || '',
      Cargo: r.cargo || '',
      Entrada: r.entrada || '',
      Salida: r.salida || '',
      Acompañante: r.acompanante || '',
    }));
    exportarExcel(agrupado, fechaSeleccionada, modoFiltro);
  };

  const eliminarRegistro = async (id) => {
    Alert.alert('¿Eliminar registro?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const actual = await loadRegistroDiario();
            const actualizado = actual.filter((r) => r.id !== id);
            await setRegistroDiario(actualizado);
            cargarRegistros();
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar el registro.');
            console.error('❌ Error al eliminar:', e);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.tipo}>{item.tipo.toUpperCase()}</Text>
        <Text style={styles.fecha}>{new Date(item.fecha).toLocaleString()}</Text>
      </View>
      <Text style={styles.nombre}>{item.nombre}</Text>
      <Text style={styles.motivo}>Motivo: {item.motivo || '—'}</Text>
      {item.rut && <Text style={styles.motivo}>RUT: {item.rut}</Text>}
      {item.matricula && <Text style={styles.motivo}>Patente: {item.matricula}</Text>}

      {item.institucion && <Text style={styles.motivo}>Institución: {item.institucion}</Text>}
      {item.cargo && <Text style={styles.motivo}>Cargo: {item.cargo}</Text>}
      {item.entrada && <Text style={styles.motivo}>Entrada: {item.entrada}</Text>}
      {item.salida && <Text style={styles.motivo}>Salida: {item.salida}</Text>}

  {item.entrada && !item.salida && (
  <TouchableOpacity
    onPress={() => marcarSalida(item.id)}
    style={styles.salidaButton}
  >
    <Text style={styles.salidaText}>📤 Marcar salida</Text>
  </TouchableOpacity>
)}

{item.motivo === 'Salida de urgencia' && item.salida && !item.entrada && (
  <TouchableOpacity
    onPress={() => marcarReingreso(item.id)}
    style={styles.reingresoButton}
  >
    <Text style={styles.reingresoText}>📥 Marcar reingreso</Text>
  </TouchableOpacity>
)}

      <TouchableOpacity
        onPress={() => eliminarRegistro(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteText}>🗑 Eliminar</Text>
      </TouchableOpacity>
      
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Registro Diario" />

      <View style={styles.filtroFecha}>
        <TouchableOpacity
          onPress={() => setMostrarPicker(true)}
          style={styles.dateButton}
        >
          <Text style={styles.dateButtonText}>
            {fechaSeleccionada
              ? new Date(fechaSeleccionada).toLocaleDateString()
              : '📅 Filtrar por fecha'}
          </Text>
        </TouchableOpacity>

        {fechaSeleccionada && (
          <TouchableOpacity
            onPress={() => setFechaSeleccionada(null)}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>❌ Quitar filtro</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
        <TouchableOpacity
          style={[
            styles.filterTypeButton,
            modoFiltro === 'dia' && { backgroundColor: '#81C784' }
          ]}
          onPress={() => setModoFiltro('dia')}
        >
          <Text style={styles.filterTypeText}>Por Día</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTypeButton,
            modoFiltro === 'semana' && { backgroundColor: '#81C784' }
          ]}
          onPress={() => setModoFiltro('semana')}
        >
          <Text style={styles.filterTypeText}>Por Semana</Text>
        </TouchableOpacity>
      </View>

      {mostrarPicker && (
        <DateTimePicker
          value={fechaSeleccionada ? new Date(fechaSeleccionada) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setMostrarPicker(false);
            if (selectedDate) {
              setFechaSeleccionada(selectedDate);
              filtrarPorFecha(registros, selectedDate);
            }
          }}
        />
      )}
<View style={{ marginBottom: 12 }}>
  <Text style={{ marginBottom: 4, fontWeight: 'bold', color: '#2E7D32' }}>🔍 Buscar por nombre o patente:</Text>
  <TextInput
    placeholder="Escribe un nombre o patente..."
    placeholderTextColor="#A5D6A7"
    style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: '#C8E6C9',
      color: '#1B5E20',
    }}
    value={busqueda}
    onChangeText={(text) => {
      setBusqueda(text);
      filtrarPorFecha(registros, fechaSeleccionada);
    }}
  />
</View>
      <TouchableOpacity style={styles.exportButton} onPress={onExportar}>
        <Text style={styles.exportText}>📤 Exportar a Excel</Text>
      </TouchableOpacity>

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id || item.fecha}
        renderItem={renderItem}
        contentContainerStyle={filtrados.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay registros para esta fecha.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  filtroFecha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: '#C8E6C9',
    padding: 10,
    borderRadius: 8,
  },
  dateButtonText: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  clearButton: {
    marginLeft: 10,
  },
  clearButtonText: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  filterTypeButton: {
    backgroundColor: '#C8E6C9',
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  filterTypeText: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  exportButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
  },
  exportText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tipo: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2E7D32',
  },
  fecha: {
    fontSize: 13,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  nombre: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  motivo: {
    fontSize: 15,
    color: '#388E3C',
  },
  deleteButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  deleteText: {
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: '600',
  },
  salidaButton: {
  marginTop: 8,
  backgroundColor: '#81C784',
  paddingVertical: 8,
  borderRadius: 8,
},
salidaText: {
  textAlign: 'center',
  color: '#1B5E20',
  fontWeight: 'bold',
},
reingresoButton: {
  marginTop: 8,
  backgroundColor: '#64B5F6', // Azul claro
  paddingVertical: 8,
  borderRadius: 8,
},
reingresoText: {
  textAlign: 'center',
  color: '#0D47A1', // Azul oscuro
  fontWeight: 'bold',
},
});
