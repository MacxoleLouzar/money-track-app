import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'item', label: 'Item' },
  { name: 'store', label: 'Store' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'quantity', label: 'Qty', type: 'number' },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Garment() {
  return <ExpensePage category="garment" title="Garments" fields={fields} />;
}
