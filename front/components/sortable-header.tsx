import {Button} from "@/components/ui/button";
import {ArrowUpDown} from "lucide-react";

export const sortableHeader =
  (label: string) =>
    ({ column }: { column: any }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    )