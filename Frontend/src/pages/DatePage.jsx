import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'restaurant', label: 'Restaurant' },
  { name: 'foodDescription', label: 'Description', full: true },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'qauntity', label: 'Qty', type: 'number' },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function DatePage() {
  return <ExpensePage category="date" title="Dates" fields={fields} scannable />;
}
