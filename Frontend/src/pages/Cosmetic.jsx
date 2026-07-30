import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'item', label: 'Item' },
  { name: 'store', label: 'Store' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'quantity', label: 'Qty', type: 'number' },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Cosmetic() {
  return <ExpensePage category="cosmetic" title="Cosmetics" fields={fields} scannable />;
}
