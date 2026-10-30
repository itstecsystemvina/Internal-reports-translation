import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PasswordForm } from "./password-form";
import { getT } from "@/lib/lang";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="max-w-md">
      <PageHeader title={(await getT()).account.title} sub={user.email} />
      <PasswordForm />
    </div>
  );
}
