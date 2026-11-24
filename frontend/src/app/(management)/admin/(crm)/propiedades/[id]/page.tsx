import PropertyEditorView from "@/features/admin/properties/PropertyEditorView";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  return <PropertyEditorView id={(await params).id}/>;
}
