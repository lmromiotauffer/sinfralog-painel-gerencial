import { CurrentSelectionsProps } from "@/components/CurrentSelections/CurrentSelections";
import { Selection } from "@cluster-data-experience/qlik-modules";

const getSelectionLabel = (selection: Selection): string => {
  const { fieldName, qSelectedFieldSelectionInfo, qSelectedCount } = selection;

  // Handle case when all values are selected or qSelectedFieldSelectionInfo is empty
  if (!qSelectedFieldSelectionInfo || qSelectedFieldSelectionInfo.length === 0) {
    return `${fieldName}: Todos (${qSelectedCount})`;
  }

  const lastSelection = qSelectedFieldSelectionInfo[qSelectedFieldSelectionInfo.length - 1];
  const selectionName = lastSelection?.qName || "Selecionado";
  const additionalCount = qSelectedCount > 1 ? `, +${qSelectedCount - 1}` : "";

  return `${fieldName}: ${selectionName}${additionalCount}`;
};

export const formatCurrentSelectionsData = (
  selections: Selection[],
): CurrentSelectionsProps["selections"] =>
  selections.map((selection) => ({
    label: getSelectionLabel(selection),
    field: selection.fieldName,
    limpar: () => selection.clear(),
  }));
