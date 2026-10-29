import { useCallback } from "react";
import { useQlikApp } from "@cluster-data-experience/qlik-modules";

// A variável de sessão vObraSelecionada é criada em src/layout/wrapper.tsx
const MAP_VARIABLE_NAME = "vObraSelecionada";
const OBRA_FIELD_NAME = "_skObra";

export const useMapVariable = () => {
  const { app } = useQlikApp();

  // Set the selected work ID - both in variable AND make field selection
  const setSelectedWork = useCallback(
    async (obraId: string) => {
      if (!app) return;

      try {
        // Set variable for expressions using $(vObraSelecionada)
        const variable = await app.getVariableByName(MAP_VARIABLE_NAME);
        if (variable) {
          await variable.setStringValue(obraId);
        }

        // Make field selection for expressions using P(_skObra)
        const field = await app.getField(OBRA_FIELD_NAME);
        if (field) {
          await field.selectValues([{ qText: obraId }], false, false);
        }
      } catch (error) {
        console.warn(`[useMapVariable] Error setting selection:`, error);
      }
    },
    [app],
  );

  // Clear the variable and field selection
  const clearSelectedWork = useCallback(async () => {
    if (!app) return;

    try {
      // Clear variable
      const variable = await app.getVariableByName(MAP_VARIABLE_NAME);
      if (variable) {
        await variable.setStringValue("");
      }

      // Clear field selection
      const field = await app.getField(OBRA_FIELD_NAME);
      if (field) {
        await field.clear();
      }
    } catch {
      // Ignore clearing errors
    }
  }, [app]);

  return {
    setSelectedWork,
    clearSelectedWork,
  };
};
