export interface Internship {
  id: string;
  companyName: string;
  role: string;
  location: string;
  logoUrl: string;
  color: string; // Dominant color for the glow effect
  postedAt: string;
}

export enum ButtonVariant {
  DEFAULT = 'default',
  TOGGLE = 'toggle',
  ARROW = 'arrow',
  PRIMARY = 'primary'
}
