import { createFileRoute } from "@tanstack/react-router";
import MediaCard from "../components/mediaCard";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <MediaCard />
    </div>
  );
}
