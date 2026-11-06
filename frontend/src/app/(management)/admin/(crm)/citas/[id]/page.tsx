import AppointmentDetailView from "@/features/admin/appointments/AppointmentDetailView";

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  return <AppointmentDetailView id={(await params).id}/>;
}
