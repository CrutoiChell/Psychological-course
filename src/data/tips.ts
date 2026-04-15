import tipsData from './content/tips.json';

export interface Tip {
  id: string;
  category: string;
  icon: string;
  title: string;
  text: string;
}

export const tips: Tip[] = tipsData;
