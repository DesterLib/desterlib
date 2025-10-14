import { createFileRoute } from "@tanstack/react-router";
import { SetupWizard } from "@/components/setup/SetupWizard";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
      <SetupWizard />
    </div>
  );
}
