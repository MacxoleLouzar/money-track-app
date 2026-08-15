import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

export default function BarcodeScanner({ visible, onScan, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      if (!permission?.granted) requestPermission();
    }
  }, [visible]);

  const handleBarcode = ({ data }) => {
    if (scanned || !data) return;
    setScanned(true);
    onScan(data);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcode}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr', 'ean13', 'ean8', 'upc_a', 'upc_e',
                'code128', 'code39', 'code93', 'codabar',
                'itf14', 'pdf417', 'aztec', 'datamatrix',
              ],
            }}
          />
        ) : (
          <View style={styles.permDenied}>
            <Ionicons name="camera-off" size={48} color={COLORS.textMuted} />
            <Text style={styles.permText}>Camera permission required</Text>
            <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Barcode / QR</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Viewfinder */}
        {permission?.granted && (
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.hint}>
              {scanned ? '✅ Scanned!' : 'Point camera at barcode or QR code'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const CORNER = 24;
const BORDER = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 54,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10,
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  frame: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: COLORS.primary },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 6 },
  hint: { color: '#fff', marginTop: 20, fontSize: 14, opacity: 0.9, textAlign: 'center' },
  permDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  permText: { color: COLORS.textMuted, fontSize: 16 },
  permBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
});
