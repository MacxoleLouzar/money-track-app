import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ALL_CATEGORIES } from '../utils/categoryFields';
import { COLORS, shared } from '../utils/theme';

export default function CategoriesScreen({ navigation }) {
  return (
    <View style={shared.container}>
      <FlatList
        data={ALL_CATEGORIES}
        keyExtractor={i => i.key}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Expense', { category: item.key, title: item.label })}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { padding: 12 },
  card: {
    flex: 1, margin: 6, backgroundColor: COLORS.white,
    borderRadius: 14, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    minHeight: 110,
  },
  emoji: { fontSize: 32, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
