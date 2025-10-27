"use client";

import CategoryCard from "./category-card";
import { useGlobalContext } from "@/components/kwizi/providers/global-context";
import { ICategory } from "@/components/kwizi/shared/types";

export default function CatalogContent() {
  const { categories } = useGlobalContext();
  return (
    <div>
      <h1 className="text-4xl font-bold">Quiz Catelog</h1>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {categories.map((category: ICategory) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
