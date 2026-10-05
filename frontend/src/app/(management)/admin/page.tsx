import { createDemoProperties } from "@/data/properties.mock";
import PropertyAdmin from "@/features/properties/admin/PropertyAdmin";

export default function AdminPage() { return <PropertyAdmin initialProperties={createDemoProperties()} />; }
