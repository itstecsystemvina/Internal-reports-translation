import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-6">
          <Logo className="mb-5 h-10" />
          <h1 className="text-2xl font-bold tracking-tight">Báo cáo tuần</h1>
          <p className="mt-1 text-sm text-muted">Đăng nhập bằng email công ty</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
