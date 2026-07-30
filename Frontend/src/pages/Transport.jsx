import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'from', label: 'From' },
  { name: 'destination', label: 'Destination' },
  { name: 'mode', label: 'Mode', type: 'select', options: ['Uber', 'Taxi', 'Train', 'Flight'] },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Transport() {
  return <ExpensePage category="transport" title="Transport" fields={fields} scannable />;
}
