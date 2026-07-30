import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'item', label: 'Item' },
  { name: 'store', label: 'Store' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'description', label: 'Description', full: true },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Other() {
  return <ExpensePage category="other" title="Other" fields={fields} scannable />;
}
