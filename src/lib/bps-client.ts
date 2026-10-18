import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * BPS profile for the UX: the signed-in user's saved profile and what it
 * configures (bps_ux in the database: the most specific correlation for each
 * UX key). Any page can use it, e.g.
 *
 *   const { ux } = useBpsProfile();
 *   const systems = (ux?.["anatomy.systems"] as string[] | undefined) ?? [];
 */

export type BpsProfileRow = {
  user_id: string;
  sex: "male" | "female";
  birth_year: number;
  ancestry_code: number;
  conditions: string[];
  primary_code: number;
  secondary_code: number;
  tertiary_code: number;
  code: string;
  updated_at: string;
};

export type BpsUx = Record<string, unknown>;

export async function fetchBpsUx(code: string): Promise<BpsUx | null> {
  const { data, error } = await supabase.rpc("bps_ux", { _code: code });
  if (error || !data) return null;
  return ((data as { ux?: BpsUx }).ux ?? {}) as BpsUx;
}

export function useBpsProfile() {
  const [profile, setProfile] = useState<BpsProfileRow | null | undefined>(undefined);
  const [ux, setUx] = useState<BpsUx | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return live && setProfile(null);
      const { data } = await supabase
        .from("bps_profiles")
        .select("*")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!live) return;
      setProfile((data as BpsProfileRow | null) ?? null);
      if (data) setUx(await fetchBpsUx((data as BpsProfileRow).code));
    })();
    return () => {
      live = false;
    };
  }, []);

  return { profile, ux };
}
