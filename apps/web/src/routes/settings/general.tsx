import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/general")({
  component: RouteComponent,
});

function RouteComponent() {
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

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Application Settings
          </h3>
          <p className="text-muted-foreground">
            General settings and preferences will be available here in future
            updates.
          </p>
        </div>
      </div>
    </div>
  );
}
