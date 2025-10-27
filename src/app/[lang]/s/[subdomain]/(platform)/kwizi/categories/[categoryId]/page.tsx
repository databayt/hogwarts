import CategoryContent from "@/components/kwizi/categories/[categoryId]/category-content";

async function page({ params }: any) {
  const { categoryId } = await params;

  return <CategoryContent categoryId={categoryId} />;
}

export default page;
