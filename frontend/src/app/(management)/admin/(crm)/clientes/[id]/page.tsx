import ClientDetailView from "@/features/admin/clients/ClientDetailView";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  return <ClientDetailView id={(await params).id}/>;
}
