import KitchenDetailView from "@/features/admin/kitchens/KitchenDetailView";

export default async function KitchenPage({ params }: { params: Promise<{ id: string }> }) {
  return <KitchenDetailView id={(await params).id}/>;
}
