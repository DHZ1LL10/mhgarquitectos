import UserEditor from "@/features/admin/users/UserEditor";
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <UserEditor id={id}/>; }
