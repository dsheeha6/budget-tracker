import CategoryForm from "@/components/CategoryForm";
import PageHeader from "@/components/PageHeader";

export default function NewCategoryPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="New category" back="/categories" />
      <div className="card">
        <CategoryForm />
      </div>
    </div>
  );
}
