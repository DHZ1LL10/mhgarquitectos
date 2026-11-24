import AdminShell from "@/features/admin/layout/AdminShell";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
