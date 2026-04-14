"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as quartersApi from "@/lib/tpmos/api/quarters";
import type { CreateQuarterInput } from "@/lib/tpmos/schemas/quarter";

export function useQuarters() {
  return useQuery({
    queryKey: ["quarters"],
    queryFn: quartersApi.listQuarters,
  });
}

export function useCreateQuarter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuarterInput) => quartersApi.createQuarter(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quarters"] }),
  });
}
