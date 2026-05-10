import { Car, ContactRound, FileText, Home, Plane, Shield, Stamp } from 'lucide-react-native';

import type { DocumentCategoryId } from '../types/document';

type Props = {
  category: DocumentCategoryId;
  size: number;
  color: string;
};

export function CategoryIcon({ category, size, color }: Props) {
  const common = { size, color, strokeWidth: 2 as const };
  switch (category) {
    case 'passport':
      return <Plane {...common} />;
    case 'visa':
      return <Stamp {...common} />;
    case 'drivers_license':
      return <Car {...common} />;
    case 'insurance':
      return <Shield {...common} />;
    case 'residence_permit':
      return <Home {...common} />;
    case 'id_card':
      return <ContactRound {...common} />;
    default:
      return <FileText {...common} />;
  }
}
