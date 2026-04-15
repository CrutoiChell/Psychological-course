export type Theme = 'crisis' | 'breakout' | 'recovery';

export interface Slide {
  theme: Theme;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export const slides: Slide[] = [
  {
    theme: 'crisis',
    title: 'Кризис',
    subtitle: 'Понимание и принятие',
    description: 'Первый шаг к изменениям — осознание проблемы и готовность её решать',
    image: '/image_0.jpg',
  },
  {
    theme: 'breakout',
    title: 'Прорыв',
    subtitle: 'Действие и трансформация',
    description: 'Активные изменения, выход из зоны комфорта, новые возможности',
    image: '/image_1.jpg',
  },
  {
    theme: 'recovery',
    title: 'Восстановление',
    subtitle: 'Гармония и рост',
    description: 'Обретение баланса, стабильности и уверенности в будущем',
    image: '/image_2.jpg',
  },
];
