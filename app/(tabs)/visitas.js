import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import uuid from 'react-native-uuid';
import Header from '../../components/header';
import { loadVisitas, saveRegistroDiario, saveVisitas } from '../../storage';

function formatearRut(value) {
  const clean = value.replace(/[^\dkK]/g, '').toUpperCase().slice(0, 9);
  if (clean.length <= 1) return clean;

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);

  let formatted = '';
  for (let i = cuerpo.length - 1, j = 1; i >= 0; i--, j++) {
    formatted = cuerpo[i] + formatted;
    if (j % 3 === 0 && i !== 0) formatted = '.' + formatted;
  }

  return `${formatted}-${dv}`;
}

function formatearFono(value) {
  const numeros = value.replace(/\D/g, '');
  return numeros.slice(0, 9);
}

function formatearPatente(value) {
  const letras = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  const grupos = letras.match(/.{1,2}/g) || [];
  return grupos.join('-');
}

export default function VisitasScreen() {
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [fono, setFono] = useState('');
  const [institucion, setInstitucion] = useState('');
  const [cargo, setCargo] = useState('');
  const [patente, setPatente] = useState('');
  const [motivo, setMotivo] = useState('');

  const limpiarCampos = () => {
    setNombre('');
    setRut('');
    setFono('');
    setInstitucion('');
    setCargo('');
    setPatente('');
    setMotivo('');
  };

  useFocusEffect(
    useCallback(() => {
      limpiarCampos();
    }, [])
  );

  const registrarVisitaConfirmada = async () => {
    const nuevaVisita = {
      id: uuid.v4(),
      nombre,
      rut,
      fono,
      institucion,
      cargo,
      motivo,
      matricula: patente,
      fecha: new Date().toISOString(),
    };

    try {
      const anteriores = await loadVisitas();
      await saveVisitas([...anteriores, nuevaVisita]);

      await saveRegistroDiario({
        id: uuid.v4(),
        tipo: 'visita',
        nombre: `${nombre} - ${rut}, - ${fono}`,
        motivo,
        matricula: patente,
        institucion,
        cargo,
        fecha: nuevaVisita.fecha,
         entrada: new Date().toLocaleTimeString(),
  
      });

      limpiarCampos();
      Keyboard.dismiss();

      Alert.alert('✅ Registro exitoso', 'La visita fue registrada.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la visita.');
      console.error(error);
    }
  };

  const confirmarRegistro = () => {
    if (!nombre || !rut || !motivo) {
      Alert.alert('Campos requeridos', 'Debes ingresar nombre, RUT y motivo.');
      return;
    }

    Alert.alert(
      'Confirmar Registro',
      `¿Registrar a "${nombre}" con RUT "${rut}" y motivo "${motivo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Registrar', onPress: registrarVisitaConfirmada }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Visitas Externas" />

      <ScrollView style={styles.form}>
        <Text style={styles.sectionTitle}>Registrar Visita</Text>

        <TextInput
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
        <TextInput
          placeholder="RUT"
          value={rut}
          onChangeText={(text) => setRut(formatearRut(text))}
          style={styles.input}
        />
        <TextInput
          placeholder="Fono"
          keyboardType="numeric"
          value={fono}
          onChangeText={(text) => setFono(formatearFono(text))}
          style={styles.input}
        />
        <TextInput
          placeholder="Institución"
          value={institucion}
          onChangeText={setInstitucion}
          style={styles.input}
        />
        <TextInput
          placeholder="Cargo"
          value={cargo}
          onChangeText={setCargo}
          style={styles.input}
        />
        <TextInput
          placeholder="Patente del auto (opcional)"
          value={patente}
          onChangeText={(text) => setPatente(formatearPatente(text))}
          style={styles.input}
        />
        <TextInput
          placeholder="Motivo de la visita"
          value={motivo}
          onChangeText={setMotivo}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={confirmarRegistro}>
          <Text style={styles.buttonText}>Guardar Visita</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#A5D6A7',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2E7D32',
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 18,
    height: 77,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  button: {
    backgroundColor: '#388E3C',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
  },
});
