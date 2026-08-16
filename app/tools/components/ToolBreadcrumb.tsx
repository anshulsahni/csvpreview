import Breadcrumb from "@/app/components/Breadcrumb";
import { requireTool } from "@/lib/tools";

export interface ToolBreadcrumbProps {
  /** Slug of the tool page this breadcrumb sits on. */
  slug: string;
}

/**
 * `Home › Tools › <tool name>` — the trail every tool page carries back to the
 * hub. Owns the registry lookup so the tool pages stay route-only.
 */
export default function ToolBreadcrumb({ slug }: ToolBreadcrumbProps) {
  const tool = requireTool(slug);

  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Tools", href: "/tools" },
        { label: tool.name },
      ]}
    />
  );
}
