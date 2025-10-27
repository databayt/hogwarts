"use client";
import React, { createContext, useContext } from "react";
import useCategories from "./use-categories";

interface QuizSetup {
  questionCount: number;
  category: string | null;
  difficulty: string | null;
}

interface Question {
  id: string;
  text: string;
  difficulty?: string | null;
  options: any[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  categoryId: string;
  questions: Question[];
}

interface QuizResponse {
  questionId: string;
  optionId: string;
  isCorrect: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  quizzes: any[];
}

interface GlobalContextType {
  loading: boolean;
  categories: Category[];
  quizSetup: QuizSetup;
  setQuizSetup: React.Dispatch<React.SetStateAction<QuizSetup>>;
  selectedQuiz: Quiz | null;
  setSelectedQuiz: React.Dispatch<React.SetStateAction<Quiz | null>>;
  quizResponses: QuizResponse[];
  setQuizResponses: React.Dispatch<React.SetStateAction<QuizResponse[]>>;
  filteredQuestions: Question[];
  setFilteredQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { loading, categories } = useCategories();

  const [quizSetup, setQuizSetup] = React.useState<QuizSetup>({
    questionCount: 1,
    category: null,
    difficulty: null,
  });
  const [selectedQuiz, setSelectedQuiz] = React.useState<Quiz | null>(null);
  const [quizResponses, setQuizResponses] = React.useState<QuizResponse[]>([]);
  const [filteredQuestions, setFilteredQuestions] = React.useState<Question[]>([]);

  return (
    <GlobalContext.Provider
      value={{
        loading,
        categories,
        quizSetup,
        setQuizSetup,
        selectedQuiz,
        setSelectedQuiz,
        quizResponses,
        setQuizResponses,
        filteredQuestions,
        setFilteredQuestions,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobalContext must be used within a GlobalContextProvider");
  }
  return context;
};
