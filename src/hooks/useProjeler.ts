import { useQuery } from "@tanstack/react-query";
import { useDataStore } from "@/stores/dataStore";

export function useProjeler() {
  const projeler = useDataStore((s) => s.projeler);

  return useQuery({
    queryKey: ["projeler", projeler],
    queryFn: () => projeler,
    initialData: projeler,
  });
}
