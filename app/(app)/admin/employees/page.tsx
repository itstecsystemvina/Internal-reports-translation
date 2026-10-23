import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { Employees } from "./employees";

export default async function EmployeesPage() {
  const me = await requireAdmin();
  const { defaultPassword } = await getSettings();
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      department: schema.users.department,
      position: schema.users.position,
      tracked: schema.users.tracked,
      active: schema.users.active,
    })
    .from(schema.users)
    .orderBy(asc(schema.users.sortOrder), asc(schema.users.name));

  return (
    <>
      <PageHeader title="Nhân viên" sub={`${rows.length} tài khoản · đăng nhập bằng email công ty`} />
      <Employees rows={rows} meId={me.id} defaultPassword={defaultPassword} />
    </>
  );
}
