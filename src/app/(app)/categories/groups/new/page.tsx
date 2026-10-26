import GroupForm from "@/components/GroupForm";
import PageHeader from "@/components/PageHeader";

export default function NewGroupPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="New folder" back="/categories" />
      <div className="card">
        <GroupForm />
      </div>
    </div>
  );
}
