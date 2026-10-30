import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { Employees } from "./employees";
import { getT } from "@/lib/lang";

export default async function EmployeesPage() {
  const me = await requireAdmin();
  const { defaultPassword } = await getSettings();
  const t = await getT();
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
      <PageHeader title={t.staff.title} sub={t.staff.sub(rows.length)} />
      <Employees rows={rows} meId={me.id} defaultPassword={defaultPassword} />
    </>
  );
}
