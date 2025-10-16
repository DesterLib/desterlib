import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/hooks/useAuth";
import { useUserCount } from "@/lib/hooks/useUserCount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Loader2, Shield, ArrowLeft } from "lucide-react";
import { registerSchema } from "@/lib/schemas/auth.schema";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { data: userCount } = useUserCount();
  const isFirstUser = userCount === 0;
  const [usePin, setUsePin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      pin: "",
      confirmPin: "",
    },
    onSubmit: async ({ value }) => {
      setError("");

      // Validate with zod
      const result = registerSchema.safeParse({
        username: value.username,
        email: value.email,
        ...(usePin
          ? { pin: value.pin, confirmPin: value.confirmPin }
          : {
              password: value.password,
              confirmPassword: value.confirmPassword,
            }),
      });

      if (!result.success) {
        setError(result.error.errors[0]?.message || "Validation failed");
        return;
      }

      setIsLoading(true);

      try {
        await register({
          username: value.username,
          email: value.email || undefined,
          ...(usePin ? { pin: value.pin } : { password: value.password }),
        });
        navigate({ to: "/" });
      } catch (err) {
        // Parse error message
        let errorMessage = "Failed to register";
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message);
            if (parsed.extra?.errors?.[0]?.message) {
              errorMessage = parsed.extra.errors[0].message;
            } else {
              errorMessage = err.message;
            }
          } catch {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900/20 via-background to-blue-900/20 p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back to Home</span>
        </button>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
            <Film className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Join Dester
          </h1>
          <p className="text-white/60 mt-2">
            Create your account to get started
          </p>

          {/* First user indicator */}
          {isFirstUser && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl">
              <Shield className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium text-purple-200">
                First user - you'll be an administrator
              </span>
            </div>
          )}
        </div>

        {/* Register Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5"
          >
            {/* Username */}
            <form.Field name="username">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-sm font-medium text-white/90"
                  >
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(e.target.value.toLowerCase())
                    }
                    onBlur={field.handleBlur}
                    placeholder="johndoe"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/50"
                    disabled={isLoading}
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-400">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                  {!field.state.meta.errors?.length && (
                    <p className="text-xs text-white/50">
                      Lowercase letters, numbers, hyphens, and underscores only
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Email (optional) */}
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-white/90"
                  >
                    Email <span className="text-white/40">(optional)</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/50"
                    disabled={isLoading}
                  />
                  {field.state.meta.errors &&
                    field.state.meta.errors.length > 0 && (
                      <p className="text-xs text-red-400">
                        {field.state.meta.errors[0]}
                      </p>
                    )}
                </div>
              )}
            </form.Field>

            {/* Password or PIN */}
            {usePin ? (
              <>
                <form.Field name="pin">
                  {(field) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="pin"
                        className="text-sm font-medium text-white/90"
                      >
                        PIN
                      </Label>
                      <Input
                        id="pin"
                        type="password"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.target.value.replace(/\D/g, ""))
                        }
                        onBlur={field.handleBlur}
                        placeholder="Enter a 4-6 digit PIN"
                        maxLength={6}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/50 font-mono text-lg tracking-widest"
                        disabled={isLoading}
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-400">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="confirmPin">
                  {(field) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPin"
                        className="text-sm font-medium text-white/90"
                      >
                        Confirm PIN
                      </Label>
                      <Input
                        id="confirmPin"
                        type="password"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.target.value.replace(/\D/g, ""))
                        }
                        onBlur={field.handleBlur}
                        placeholder="Re-enter your PIN"
                        maxLength={6}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/50 font-mono text-lg tracking-widest"
                        disabled={isLoading}
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-400">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>
              </>
            ) : (
              <>
                <form.Field name="password">
                  {(field) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-white/90"
                      >
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Create a password"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/50"
                        disabled={isLoading}
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-400">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>

                <form.Field name="confirmPassword">
                  {(field) => (
                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-white/90"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Confirm your password"
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-500/50 focus:ring-purple-500/50"
                        disabled={isLoading}
                      />
                      {field.state.meta.errors &&
                        field.state.meta.errors.length > 0 && (
                          <p className="text-xs text-red-400">
                            {field.state.meta.errors[0]}
                          </p>
                        )}
                    </div>
                  )}
                </form.Field>
              </>
            )}

            {/* Toggle PIN/Password */}
            <button
              type="button"
              onClick={() => {
                setUsePin(!usePin);
                form.setFieldValue("password", "");
                form.setFieldValue("confirmPassword", "");
                form.setFieldValue("pin", "");
                form.setFieldValue("confirmPin", "");
              }}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              disabled={isLoading}
            >
              {usePin ? "Use password instead" : "Use PIN instead"}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Already have an account?{" "}
              <button
                onClick={() => navigate({ to: "/login" })}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8">
          Your personal media library manager
        </p>
      </div>
    </div>
  );
}
