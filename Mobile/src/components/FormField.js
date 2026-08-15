import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { useState } from 'react';
import { COLORS, shared } from '../utils/theme';

export default function FormField({ field, value, onChange }) {
  const [pickerVisible, setPickerVisible] = useState(false);

  if (field.type === 'select') {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={shared.label}>{field.label}</Text>
        <TouchableOpacity style={[shared.input, styles.selectBtn]} onPress={() => setPickerVisible(true)}>
          <Text style={{ color: value ? COLORS.text : COLORS.textMuted, fontSize: 15 }}>
            {value || `Select ${field.label}...`}
          </Text>
        </TouchableOpacity>
        <Modal visible={pickerVisible} transparent animationType="slide">
          <TouchableOpacity style={styles.overlay} onPress={() => setPickerVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{field.label}</Text>
            <ScrollView>
              {field.options.map(opt => (
                <TouchableOpacity key={opt} style={styles.sheetItem} onPress={() => { onChange(opt); setPickerVisible(false); }}>
                  <Text style={[styles.sheetItemText, value === opt && { color: COLORS.primary, fontWeight: '700' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }

  if (field.type === 'boolean') {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={shared.label}>{field.label}</Text>
        <View style={shared.row}>
          {['Yes', 'No'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.boolBtn, value === (opt === 'Yes' ? 'true' : 'false') && styles.boolBtnActive]}
              onPress={() => onChange(opt === 'Yes' ? 'true' : 'false')}
            >
              <Text style={[styles.boolText, value === (opt === 'Yes' ? 'true' : 'false') && styles.boolTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={shared.label}>{field.label}</Text>
      <TextInput
        style={shared.input}
        value={value || ''}
        onChangeText={onChange}
        placeholder={field.label}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  selectBtn: { marginBottom: 0, justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: COLORS.text },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetItemText: { fontSize: 15, color: COLORS.text },
  boolBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 20, marginRight: 8,
  },
  boolBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  boolText: { color: COLORS.text, fontWeight: '500' },
  boolTextActive: { color: COLORS.white },
});
