import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/nutrition-index")({
  head: () => ({
    meta: [
      { title: "Nutrition Index — Personalized Nutrition" },
      { name: "description", content: "A searchable index of foods and their nutritional profiles." },
      { property: "og:title", content: "Nutrition Index — Personalized Nutrition" },
      { property: "og:description", content: "A searchable index of foods and their nutritional profiles." },
    ],
  }),
  component: NutritionIndex,
});

function NutritionIndex() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["nutrition_index"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_index")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        Nutrition Index
      </p>
      <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-6xl">
        A living index.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Foods, nutrients, and notes — curated and continuously updated.
      </p>

      <div className="mt-16 border-t border-[color:var(--color-hairline)]">
        {isLoading && (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {error && (
          <div className="py-16 text-center text-sm text-destructive">
            Couldn't load nutrition data.
          </div>
        )}
        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <div className="py-24 text-center">
            <p className="text-sm text-muted-foreground">
              No entries yet. Admins can add nutrition data from the hub.
            </p>
          </div>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-[color:var(--color-hairline)]">
            {data.map((row) => (
              <li key={row.id} className="py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-medium">{row.name}</h2>
                    {row.category && (
                      <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                        {row.category}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
                    {row.calories != null && <span>{row.calories} kcal</span>}
                    {row.protein_g != null && <span>P {row.protein_g}g</span>}
                    {row.carbs_g != null && <span>C {row.carbs_g}g</span>}
                    {row.fat_g != null && <span>F {row.fat_g}g</span>}
                  </div>
                </div>
                {row.description && (
                  <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                    {row.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
