import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/api/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Icon } from "@/components/custom/icon";
import { openSettingsInFlutter, isFlutterWebView } from "@/utils/flutterBridge";

const settingsUpdateSchema = z.object({
  tmdbApiKey: z.string().optional(),
  port: z.number().min(1000).max(65535).optional(),
  enableRouteGuards: z.boolean().optional(),
});

type SettingsForm = z.infer<typeof settingsUpdateSchema>;

export const Route = createFileRoute("/settings/general")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    highlight: (search.highlight as string) || undefined,
  }),
});

function RouteComponent() {
  const { data: settings, isLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();
  const { highlight } = useSearch({ from: "/settings/general" });
  const tmdbInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      tmdbApiKey: "",
      port: 3001,
      enableRouteGuards: false,
    } as SettingsForm,
    onSubmit: async ({ value }) => {
      try {
        const validatedData = settingsUpdateSchema.parse(value);
        await updateSettings.mutateAsync(validatedData);
      } catch (error) {
        console.error("Failed to update settings:", error);
      }
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.setFieldValue("tmdbApiKey", settings.tmdbApiKey || "");
      form.setFieldValue("port", settings.port);
      form.setFieldValue("enableRouteGuards", settings.enableRouteGuards);
    }
  }, [settings, form]);

  // Handle highlighting the TMDB input when redirected from libraries
  useEffect(() => {
    if (highlight === "tmdb" && tmdbInputRef.current && !isLoading) {
      // Scroll to the TMDB section and focus the input
      tmdbInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Focus the input after a short delay to ensure it's visible
      setTimeout(() => {
        tmdbInputRef.current?.focus();
      }, 500);
    }
  }, [highlight, isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Icon name="warning" size={32} className="text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Error loading settings
          </h3>
          <p className="text-destructive max-w-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              General Settings
            </h2>
            <p className="text-muted-foreground">
              Configure general application settings and preferences.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* TMDB API Settings */}
        <div
          className={`bg-card border rounded-2xl p-6 transition-all duration-300 ${
            highlight === "tmdb"
              ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10"
              : "border-border"
          }`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex-shrink-0">
              <Icon name="movie" size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                TMDB API Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                {highlight === "tmdb" ? (
                  <>
                    <span className="text-primary font-medium">Required:</span>{" "}
                    Configure your TMDB API key to create and manage media
                    libraries. Get your API key from{" "}
                    <a
                      href="https://www.themoviedb.org/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      TMDB Settings
                    </a>
                    .
                  </>
                ) : (
                  "Configure your TMDB API key for fetching movie and TV show metadata."
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <form.Field
              name="tmdbApiKey"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return undefined;
                  try {
                    settingsUpdateSchema.shape.tmdbApiKey.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid API key";
                    }
                    return "Invalid API key";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>TMDB API Key</FieldLabel>
                  <FieldContent>
                    <Input
                      ref={tmdbInputRef}
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Enter your TMDB API key"
                      aria-invalid={field.state.meta.errors.length > 0}
                      className={
                        highlight === "tmdb"
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }
                    />
                  </FieldContent>
                  <FieldDescription>
                    Your API key from The Movie Database (TMDB)
                  </FieldDescription>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </form.Field>
          </div>
        </div>

        {/* Server Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex-shrink-0">
              <Icon name="settings" size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Server Configuration
              </h3>
              <p className="text-muted-foreground text-sm">
                Configure server settings and security options.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <form.Field
              name="port"
              validators={{
                onChange: ({ value }) => {
                  try {
                    settingsUpdateSchema.shape.port.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid port number";
                    }
                    return "Port must be between 1000 and 65535";
                  }
                },
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Server Port</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(parseInt(e.target.value) || 3001)
                      }
                      min={1000}
                      max={65535}
                      aria-invalid={field.state.meta.errors.length > 0}
                    />
                  </FieldContent>
                  <FieldDescription>
                    Port number for the API server (1000-65535)
                  </FieldDescription>
                  <FieldError>
                    {field.state.meta.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </FieldError>
                </Field>
              )}
            </form.Field>
          </div>
        </div>

        {/* Mobile App Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex-shrink-0">
              <Icon name="phone_android" size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Mobile App Connection
              </h3>
              <p className="text-muted-foreground text-sm">
                Configure server settings for mobile app connection.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex flex-col gap-2 flex-1">
                <div className="text-base font-medium text-foreground">
                  Server IP Configuration
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {isFlutterWebView()
                    ? "Configure the server IP address that this mobile app should connect to."
                    : "Configure the server IP address that mobile apps should connect to. This is typically your server's local network IP address."}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isFlutterWebView() ? (
                  <Button
                    onClick={async () => {
                      try {
                        await openSettingsInFlutter();
                      } catch (error) {
                        console.error(
                          "Failed to open Flutter settings:",
                          error
                        );
                      }
                    }}
                    className="gap-2"
                  >
                    <Icon name="settings" size={16} />
                    Configure Server IP
                  </Button>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Current:{" "}
                      <span className="font-mono">
                        {window.location.hostname}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        // Copy current hostname to clipboard
                        navigator.clipboard.writeText(window.location.hostname);
                        // You could add a toast notification here
                      }}
                    >
                      <Icon name="content_copy" size={16} />
                      Copy IP
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex-shrink-0">
              <Icon name="security" size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                Security Settings
              </h3>
              <p className="text-muted-foreground text-sm">
                Configure security and authentication settings.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <form.Field name="enableRouteGuards">
              {(field) => (
                <div className="flex items-start justify-between gap-6 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-base font-medium text-foreground mb-1"
                    >
                      Enable Route Guards
                    </FieldLabel>
                    <FieldDescription className="text-sm text-muted-foreground leading-relaxed">
                      Enable authentication and authorization checks for API
                      routes. When enabled, the server will require proper
                      authentication tokens for protected endpoints.
                    </FieldDescription>
                  </div>
                  <div className="flex items-center justify-center w-fit flex-shrink-0">
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/60"
                    />
                  </div>
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={updateSettings.isPending}
            className="gap-2"
          >
            {updateSettings.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon name="save" size={16} />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
