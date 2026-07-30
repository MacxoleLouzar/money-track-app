import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'date', label: 'Date', type: 'date', full: true },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
  { name: 'invoice', label: 'Invoice', type: 'file' },
];

export default function Rent() {
  return <ExpensePage category="rent" title="Rent" fields={fields} />;
}
