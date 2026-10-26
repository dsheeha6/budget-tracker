import Link from "next/link";
import CategoryForm from "@/components/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <Link href="/categories" className="px-1 text-2xl text-zinc-500" aria-label="Back">‹</Link>
        <h1 className="text-2xl font-bold">New category</h1>
      </header>
      <div className="card">
        <CategoryForm />
      </div>
    </div>
  );
}
