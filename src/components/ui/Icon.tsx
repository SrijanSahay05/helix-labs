import {
  AlignHorizontalJustifyCenter, Anchor, Box, BrickWall, Brush, Building, CalendarClock, Cloud, CloudRain, CloudSun, Cog, Columns3, Cylinder, Droplets, FlaskConical, Flame, Footprints, Gem, Grid2x2, Grid3x3, Hammer, Hexagon, Hourglass, House, Layers, LayoutGrid, Link, Mountain, PaintRoller, PanelTop, Pipette, Ribbon, Rows3, Shield, ShieldCheck, ShowerHead, Spline, Square, Sticker, StretchHorizontal, Sun, Syringe, Thermometer, ThermometerSun, Timer, Truck, Umbrella, WavesHorizontal, Wind, Zap, type LucideIcon,
} from 'lucide-react';

/** Explicit icon registry for data-driven icons (keeps the bundle tree-shaken). */
const ICONS: Record<string, LucideIcon> = {
  AlignHorizontalJustifyCenter, Anchor, Box, BrickWall, Brush, Building, CalendarClock, Cloud, CloudRain, CloudSun, Cog, Columns3, Cylinder, Droplets, FlaskConical, Flame, Footprints, Gem, Grid2x2, Grid3x3, Hammer, Hexagon, Hourglass, House, Layers, LayoutGrid, Link, Mountain, PaintRoller, PanelTop, Pipette, Ribbon, Rows3, Shield, ShieldCheck, ShowerHead, Spline, Square, Sticker, StretchHorizontal, Sun, Syringe, Thermometer, ThermometerSun, Timer, Truck, Umbrella, WavesHorizontal, Wind, Zap,
};

export function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Box;
  return <C size={size} className={className} />;
}
