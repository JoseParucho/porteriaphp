import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_APODERADOS = 'apoderados';
const KEY_PROVEEDORES = 'proveedores';
const KEY_VISITAS = 'visitas';
const KEY_FUNCIONARIOS = 'funcionarios';
const KEY_ESTUDIANTES = 'estudiantes';
const KEY_REGISTRO_DIARIO = 'registro_diario';

// --- APODERADOS ---
export const saveApoderados = async (apoderados) => {
  try {
    const json = JSON.stringify(apoderados);
    await AsyncStorage.setItem(KEY_APODERADOS, json);
  } catch (e) {
    console.error('Error al guardar apoderados:', e);
  }
};

export const loadApoderados = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY_APODERADOS);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error al cargar apoderados:', e);
    return [];
  }
};

// --- ESTUDIANTES ---
export const saveEstudiantes = async (estudiantes) => {
  try {
    const json = JSON.stringify(estudiantes);
    await AsyncStorage.setItem(KEY_ESTUDIANTES, json);
  } catch (e) {
    console.error('Error al guardar estudiantes:', e);
  }
};

export const loadEstudiantes = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY_ESTUDIANTES);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error al cargar estudiantes:', e);
    return [];
  }
};

// --- PROVEEDORES ---
export const saveProveedores = async (proveedores) => {
  try {
    const json = JSON.stringify(proveedores);
    await AsyncStorage.setItem(KEY_PROVEEDORES, json);
  } catch (e) {
    console.error('Error al guardar proveedores:', e);
  }
};

export const loadProveedores = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY_PROVEEDORES);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error al cargar proveedores:', e);
    return [];
  }
};

// --- VISITAS ---
export const saveVisitas = async (visitas) => {
  try {
    const json = JSON.stringify(visitas);
    await AsyncStorage.setItem(KEY_VISITAS, json);
  } catch (e) {
    console.error('Error al guardar visitas:', e);
  }
};

export const loadVisitas = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY_VISITAS);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error al cargar visitas:', e);
    return [];
  }
};

// --- FUNCIONARIOS ---
export const saveFuncionarios = async (funcionarios) => {
  try {
    const json = JSON.stringify(funcionarios);
    await AsyncStorage.setItem(KEY_FUNCIONARIOS, json);
  } catch (e) {
    console.error('Error al guardar funcionarios:', e);
  }
};

export const loadFuncionarios = async () => {
  try {
    const json = await AsyncStorage.getItem(KEY_FUNCIONARIOS);
    return json != null ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error al cargar funcionarios:', e);
    return [];
  }
};

// --- REGISTRO DIARIO ---
export const saveRegistroDiario = async (nuevoRegistro) => {
  try {
    const actual = await loadRegistroDiario();
    const actualizado = [...actual, nuevoRegistro];
    await AsyncStorage.setItem(KEY_REGISTRO_DIARIO, JSON.stringify(actualizado));
  } catch (e) {
    console.error('Error al guardar en registro diario:', e);
  }
};

export const loadRegistroDiario = async () => {
  try {
    const data = await AsyncStorage.getItem(KEY_REGISTRO_DIARIO);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error al cargar registro diario:', e);
    return [];
  }
};

export const setRegistroDiario = async (nuevosRegistros) => {
  try {
    await AsyncStorage.setItem(KEY_REGISTRO_DIARIO, JSON.stringify(nuevosRegistros));
  } catch (e) {
    console.error('Error al sobrescribir el registro diario:', e);
  }
};
