// Shared types used across multiple routes

export interface ICategory {
  id: string;
  name: string;
  description: string;
  image?: string;
  quizzes: IQuiz[];
}

export interface IQuiz {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  categoryId: string;
  questions: IQuestion[];
}

export interface IQuestion {
  id: string;
  text: string;
  difficulty?: string | null;
  options: IOption[];
}

export interface IOption {
  id: string;
  text: string;
  isCorrect: boolean;
}
