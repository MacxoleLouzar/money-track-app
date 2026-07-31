import ExpensePage from '../components/ExpensePage';

const fields = [
  { name: 'item', label: 'Item' },
  { name: 'barcode', label: 'Barcode', full: true },
  { name: 'quantity', label: 'Qty', type: 'number' },
  { name: 'sizeValue', label: 'Size Amount', type: 'number' },
  { name: 'size', label: 'Size Unit', type: 'select', options: [
    'kg (Kilogram)',
    'g (Gram)',
    'L (Liter)',
    'ml (Milliliter)',
    'oz (Ounce)',
    'lb (Pound)',
    'pcs (Pieces)',
    'pk (Pack)',
    'unit (Unit)',
  ]},
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'store', label: 'Store' },
  { name: 'onSale', label: 'On Sale?', type: 'checkbox' },
  { name: 'image', label: 'Image', type: 'file' },
  { name: 'slip', label: 'Slip', type: 'file' },
];

export default function Grocery() {
  return <ExpensePage category="grocery" title="Groceries" fields={fields} scannable />;
}
