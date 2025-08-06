import { useFocusEffect } from '@react-navigation/native'; // para resetear estado al enfocar pantalla
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { loadFuncionarios, loadRegistroDiario, saveRegistroDiario, setRegistroDiario } from '../../storage';

export default function QrScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [funcionario, setFuncionario] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraKey, setCameraKey] = useState(0); // para forzar remount cámara

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // Resetear escaneo cada vez que se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setFuncionario(null);
      setModalVisible(false);
      setCameraKey(prev => prev + 1); // fuerza remount cámara
    }, [])
  );

  const resetScanner = () => {
    setFuncionario(null);
    setModalVisible(false);
    setScanned(false);
    setCameraKey(prev => prev + 1); // fuerza remount cámara para evitar bloqueo
  };

  const registrar = async (tipo) => {
    if (!funcionario) return;

    try {
      const ahora = new Date();
      const fechaActual = ahora.toISOString().split('T')[0];
      const registros = (await loadRegistroDiario()) || [];

      const existente = registros.find(r =>
        r.tipo === 'funcionario' &&
        r.nombre === funcionario.nombre &&
        r.fecha.startsWith(fechaActual)
      );

      if (tipo === 'entrada') {
        if (existente && existente.entrada) {
          Alert.alert('❌ Ya tiene entrada registrada');
          return;
        }
        const nuevoRegistro = {
          id: Date.now().toString(),
          tipo: 'funcionario',
          nombre: funcionario.nombre,
          fecha: ahora.toISOString(),
          entrada: ahora.toLocaleTimeString(),
          salida: '',
          motivo: 'Ingreso al establecimiento',
          matricula: funcionario.patente,
        };
        await saveRegistroDiario(nuevoRegistro);
        Alert.alert('✅ Entrada registrada', `Entrada de ${funcionario.nombre} registrada.`);
      } else {
        if (!existente || !existente.entrada) {
          Alert.alert('❌ No hay entrada previa para registrar salida');
          return;
        }
        const registrosActualizados = registros.map(r => {
          if (r.id === existente.id) {
            return {
              ...r,
              salida: ahora.toLocaleTimeString(),
              motivo: 'Salida del establecimiento',
            };
          }
          return r;
        });
        await setRegistroDiario(registrosActualizados);
        Alert.alert('✅ Salida registrada', `Salida de ${funcionario.nombre} registrada.`);
      }
      resetScanner();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la hora.');
    }
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    try {
      const lineas = data.split('\n').map(l => l.trim());
      const [codigo, nombre, rut, patente] = lineas;

      const funcionarios = await loadFuncionarios();

      const encontrado = funcionarios.find(f =>
        (f.codigo && f.codigo.toLowerCase() === (codigo || '').toLowerCase()) ||
        (f.rut && f.rut.toLowerCase() === (rut || '').toLowerCase()) ||
        (f.nombre && f.nombre.toLowerCase() === (nombre || '').toLowerCase())
      );

      if (!encontrado) {
        Alert.alert('❌ Funcionario no registrado');
        setTimeout(() => setScanned(false), 1500);
        return;
      }

      setFuncionario(encontrado);
      setModalVisible(true);
    } catch {
      Alert.alert('⚠️ Código QR inválido');
      setTimeout(() => setScanned(false), 1500);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>📷 Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: 'blue', marginTop: 10 }}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        key={cameraKey}  // cambio aquí para forzar remount
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Registrar hora para:</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 20 }}>
              {funcionario?.nombre}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={() => registrar('entrada')}>
                <Text style={styles.buttonText}>Registrar Entrada</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmButton} onPress={() => registrar('salida')}>
                <Text style={styles.buttonText}>Registrar Salida</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={resetScanner}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#B71C1C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
