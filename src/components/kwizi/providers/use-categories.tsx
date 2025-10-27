"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  quizzes: any[];
}

function useCategories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setLoading(false);
      }
    };

    getCategories();
  }, []);

  return { loading, categories };
}

export default useCategories;
