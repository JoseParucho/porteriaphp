import AsyncStorage from '@react-native-async-storage/async-storage';
import apoderados from './assets/apoderados.json';
import proveedores from './assets/proveedores.json';

const KEY_APODERADOS = 'apoderados';
const KEY_PROVEEDORES = 'proveedores';

export const initAppData = async () => {
  try {
  
    const yaExisten = await AsyncStorage.getItem(KEY_APODERADOS);

    if (!yaExisten) {
      const filtrados = apoderados.filter(item =>
        item.nombreApoderado &&
        item.rutApoderado &&
        item.nombreApoderado.toLowerCase() !== 'nan' &&
        item.rutApoderado.toLowerCase() !== 'nan' &&
        item.nombreApoderado.toLowerCase() !== 'columna12'
      );

      await AsyncStorage.setItem(KEY_APODERADOS, JSON.stringify(filtrados));
      console.log('✅ Datos iniciales de apoderados guardados');
    } else {
      console.log('ℹ️ Apoderados ya estaban guardados');
    }


    const proveedoresGuardados = await AsyncStorage.getItem(KEY_PROVEEDORES);

    if (!proveedoresGuardados) {
      await AsyncStorage.setItem(KEY_PROVEEDORES, JSON.stringify(proveedores));
      console.log('✅ Datos iniciales de proveedores guardados');
    } else {
      console.log('ℹ️ Proveedores ya estaban guardados');
    }

  } catch (error) {
    console.error('❌ Error al inicializar datos:', error);
  }
};
