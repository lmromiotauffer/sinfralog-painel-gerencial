import { FieldSelections } from "@/components/FieldSelections/FieldSelections";
import { useQlikSelections, useQlikApp } from "@cluster-data-experience/qlik-modules";
import { memo, useMemo } from "react";

type FieldSelectionsProviderProps = {
  field: string;
  label?: string;
};

type SelectionInfo = {
  qName: string;
  qElemNumber?: number;
};

export const FieldSelectionsProvider: React.FC<FieldSelectionsProviderProps> =
  memo(({ field, label }) => {
    const { items } = useQlikSelections();
    const { app } = useQlikApp();

    const fieldSelection = useMemo(() => {
      return items.find((item) => item.fieldName === field);
    }, [items, field]);


    const options = useMemo(() => {
      if (!fieldSelection) return [];

      return ((fieldSelection.qSelectedFieldSelectionInfo ?? []) as SelectionInfo[]).map((selection, index) => ({
        qText: selection.qName,
        qNum: undefined,
        qElemNumber: index,
      }));
    }, [fieldSelection]);

    const handleRemoveItem = async (index: number) => {
      const selectionToRemove = (fieldSelection?.qSelectedFieldSelectionInfo as SelectionInfo[] | undefined)?.[index];
      if (!app || !selectionToRemove) return;
      const qlikField = await app.getField(field);
      await qlikField.toggleSelect(selectionToRemove.qName, true);
    };

    if (!fieldSelection || options.length === 0) {
      return null;
    }

    return (
      <FieldSelections
        title={label ?? field}
        subtitle={`${options.length} selecionado(s)`}
        options={options}
        handleRemoveItem={handleRemoveItem}
        isOneAndOnlyOne={false}
      />
    );
  });
