import { useForm } from "@tanstack/react-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TmdbApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (apiKey: string) => Promise<void>;
  currentApiKey?: string;
}

export function TmdbApiKeyDialog({
  open,
  onOpenChange,
  onSubmit,
  currentApiKey,
}: TmdbApiKeyDialogProps) {
  const form = useForm({
    defaultValues: {
      apiKey: currentApiKey || "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value.apiKey);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/10 backdrop-blur-xl rounded-3xl border-white/10">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-bold">
            Configure TMDB API Key
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Enter your API key from The Movie Database (TMDB) to enable
            automatic metadata fetching.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* API Key Field */}
          <form.Field name="apiKey">
            {(field) => (
              <div className="space-y-2">
                <Label
                  htmlFor="apiKey"
                  className="text-sm font-medium text-white/90"
                >
                  API Key *
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Enter your TMDB API key"
                  className="bg-white/5 border-white/10 focus:border-white/20 font-mono text-sm"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Instructions */}
          <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
            <p className="text-xs text-blue-400 leading-relaxed">
              <strong className="font-semibold">Don't have an API key?</strong>
              <br />
              <span className="block mt-2 space-y-1">
                <span className="block">
                  1. Visit{" "}
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300 transition-colors"
                  >
                    themoviedb.org/settings/api
                  </a>
                </span>
                <span className="block">
                  2. Create a free account if you don't have one
                </span>
                <span className="block">
                  3. Request an API key under the "API" section
                </span>
                <span className="block">
                  4. Copy your "API Key (v3 auth)" here
                </span>
              </span>
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Saving..." : "Save API Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
