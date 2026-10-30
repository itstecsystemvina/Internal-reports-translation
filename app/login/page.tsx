import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";
import { LangToggle } from "@/components/nav";
import { getT } from "@/lib/lang";

export default async function LoginPage() {
  const t = await getT();
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>
      <div className="w-full max-w-[380px]">
        <div className="mb-6">
          <Logo className="mb-5 h-10" />
          <h1 className="text-2xl font-bold tracking-tight">{t.app.name}</h1>
          <p className="mt-1 text-sm text-muted">{t.login.subtitle}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
