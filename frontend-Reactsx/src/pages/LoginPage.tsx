import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/layout/Layout";
import { Button, Input, Card } from "../components/ui";

const loginSchema = z.object({
  email: z.string().email("errors.invalidEmail"),
  password: z.string().min(8, "errors.passwordTooShort"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loginWithGoogle, error: authError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <Layout showNavbar={false}>
      <div className="min-h-screen flex items-center justify-center p-4 gradient-dark">
        <Card className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 gradient-red rounded-2xl mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t("auth.welcomeBack")}
            </h1>
            <p className="text-gray-400">{t("auth.loginDescription")}</p>
          </div>

          {/* Error message */}
          {authError && (
            <div className="mb-6 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}

          {/* Google Login */}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleGoogleLogin}
            className="mb-6"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("auth.loginWithGoogle")}
          </Button>

          <div className="divider" />

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="usuario@ejemplo.com"
              error={errors.email ? t(errors.email.message!) : undefined}
              fullWidth
              {...register("email")}
            />

            <Input
              label={t("auth.password")}
              type="password"
              placeholder="••••••••"
              error={errors.password ? t(errors.password.message!) : undefined}
              fullWidth
              {...register("password")}
            />

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-primary-500 hover:text-primary-400 transition-colors"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              {t("auth.login")}
            </Button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">{t("auth.noAccount")} </span>
            <Link
              to="/register"
              className="text-primary-500 hover:text-primary-400 transition-colors font-medium"
            >
              {t("auth.register")}
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
