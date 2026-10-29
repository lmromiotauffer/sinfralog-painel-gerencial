import { useMemo, useCallback, useRef, useEffect } from "react";
import { useGenericListObject } from "@cluster-data-experience/qlik-modules";

// ponytail: debounce local com cancel; mover para shared/utils se surgir um segundo consumidor
function debounce(fn: () => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = () => {
    clearTimeout(timer);
    timer = setTimeout(fn, wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

export interface ObraTypeFilter {
  id: string;
  label: string;
  qElemNumber: number;
  isSelected: boolean;
}

interface TypeFilterConfig {
  qFieldDefs?: string[];
  qFieldLabels?: string[];
  label?: string;
}

export const useTypeFilters = (config?: TypeFilterConfig) => {
  const fieldDef = config?.qFieldDefs?.[0] || "[Tipo da obra]";
  const fieldLabel = config?.qFieldLabels?.[0] || "Tipo da obra";

  const { data, isLoading, handleToggleSelections, title } =
    useGenericListObject({
      qFieldDefs: [fieldDef],
      qFieldLabels: [fieldLabel],
      qSortCriterias: [{ qSortByAscii: 1 }], // Sempre ordem alfabética
    });


  // Parse types from Qlik data
  const types = useMemo<ObraTypeFilter[]>(() => {
    if (!data || !data.length) {
      return [];
    }

    // data é um array de rows (INxCellRows[])
    // Cada row é um array de cells
    return data.flatMap((row) =>
      row.map((cell:  {
                        qText?: string;
                        qElemNumber?: number;
                        qState?: string;
                      }) => {
        const label = cell?.qText || "Outros";
        const qElemNumber = cell?.qElemNumber ?? -1;
        const qState = cell?.qState || "O"; // O = Optional, S = Selected, X = Excluded, L = Locked
        const isSelected = qState === "S" || qState === "L";

        return {
          id: `${qElemNumber}`,
          label,
          qElemNumber,
          isSelected,
        };
      }),
    );
  }, [data]);

  const pendingToggles = useRef<Set<number>>(new Set());
  const typesRef = useRef(types);
  const handleToggleSelectionsRef = useRef(handleToggleSelections);

  useEffect(() => {
    typesRef.current = types;
    handleToggleSelectionsRef.current = handleToggleSelections;
  }, [types, handleToggleSelections]);

  const debouncedToggle = useMemo(
    () =>
      // A leitura das refs acontece só quando o debounce dispara, nunca durante o render
      // eslint-disable-next-line react-hooks/refs
      debounce(() => {
        const currentTypes = typesRef.current;
        const toggleFn = handleToggleSelectionsRef.current;
        const pending = pendingToggles.current;

        if (pending.size > 0 && toggleFn) {
          // Filter only valid types to avoid issues with duplicates or invalid IDs
          const validTypes = currentTypes.filter((t) => t.qElemNumber >= 0);
          const allValidIds = new Set(validTypes.map((t) => t.qElemNumber));

          const currentSelected = validTypes.filter((t) => t.isSelected);
          const currentSelectedIds = new Set(
            currentSelected.map((t) => t.qElemNumber),
          );

          // Calculate what the selection would be if we applied the pending toggles
          const futureSelectedIds = new Set(currentSelectedIds);
          pending.forEach((qElemNumber) => {
            if (!allValidIds.has(qElemNumber)) return;

            if (futureSelectedIds.has(qElemNumber)) {
              futureSelectedIds.delete(qElemNumber);
            } else {
              futureSelectedIds.add(qElemNumber);
            }
          });

          // If the result would be "All Selected", we want to "Clear All" instead.
          const wouldSelectAll =
            allValidIds.size > 0 && futureSelectedIds.size === allValidIds.size;

          if (wouldSelectAll) {
            const idsToClear = Array.from(currentSelectedIds);
            toggleFn(idsToClear);
          } else {
            const toggles = Array.from(pending);
            toggleFn(toggles);
          }

          pending.clear();
        }
      }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedToggle.cancel();
    };
  }, [debouncedToggle]);

  // Toggle type selection in Qlik
  const toggleType = useCallback(
    (typeId: string) => {
      const type = types.find((t) => t.id === typeId);
      if (type) {
        const qElemNumber = type.qElemNumber;
        if (pendingToggles.current.has(qElemNumber)) {
          pendingToggles.current.delete(qElemNumber);
        } else {
          pendingToggles.current.add(qElemNumber);
        }
        debouncedToggle();
      }
    },
    [types, debouncedToggle],
  );

  // Clear all selections
  const clearFilters = useCallback(() => {
    const selectedIds = types
      .filter((t) => t.isSelected)
      .map((t) => t.qElemNumber);

    if (selectedIds.length > 0 && handleToggleSelections) {
      handleToggleSelections(selectedIds);
    }
  }, [types, handleToggleSelections]);

  return {
    types,
    isLoading,
    toggleType,
    clearFilters,
    title: config?.label || title,
  };
};
