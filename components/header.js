import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Header({ title = '' }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
        <Ionicons name="home" size={24} color="#fff" />
      </TouchableOpacity>

      <Image source={require('../assets/Logo.png')} style={styles.logo} resizeMode="contain" />
      
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#388E3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    padding: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 6,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
