import { Package, Coffee, Candy, CupSoda, Pill, Leaf, Flame, Sparkles } from 'lucide-react';

const emojiToIconMap = {
  '🚬': Flame,
  '☕': Coffee,
  '🍬': Candy,
  '🧃': CupSoda,
  '🍫': Candy,
  '💊': Pill,
  '🧈': Package,
  '🥤': CupSoda,
  '🍵': Coffee,
  '🌿': Leaf,
};

export default function LucideIcon({ nameOrEmoji, size = 24, color, ...props }) {
  const IconComponent = emojiToIconMap[nameOrEmoji] || Sparkles;
  return <IconComponent size={size} color={color || 'currentColor'} strokeWidth={1.5} {...props} />;
}
