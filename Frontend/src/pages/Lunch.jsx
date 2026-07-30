import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'foodType', label: 'Food Type' },
  { name: 'store', label: 'Store' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'PersonBuyingForName', label: 'Buying For' },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Lunch() {
  return <ExpensePage category="lunch" title="Lunch" fields={fields} scannable />;
}
