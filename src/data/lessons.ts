import lessonsData from './content/lessons.json';

export interface Lesson {
  id: string;
  title: string;
  module: string;
  moduleNumber: number;
  content: string;
  image?: string;
  videoUrl?: string | null;
}

export const lessons: Lesson[] = lessonsData;
