import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'item', label: 'Item' },
  { name: 'store', label: 'Store' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'PersonBuyingForName', label: 'Buying For' },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Takeout() {
  return <ExpensePage category="takeout" title="Takeouts" fields={fields} scannable />;
}
