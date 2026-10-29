import React, { useState, useMemo } from "react";
import { useGenericListObject } from "@cluster-data-experience/qlik-modules";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/popover";
import { FilterObjectOption, FilterObjectOptionValue } from "@/components/FilterObject/@types/types";
import { toOption } from "@/shared/utils/qlik/toOption";
import { VirtualizedList } from "@/components/FilterObject/components/VirtualList/VirtualizedList";
import { ButtonMenu } from "@/components/FilterObject/components/ButtonMenu/ButtonMenu";

interface ColumnFilterProps {
  fieldName: string;
  label: string;
}

export const ColumnFilter: React.FC<ColumnFilterProps> = ({ fieldName, label }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const {
    data,
    layout,
    isFetching,
    hasMoreData,
    getNextPage,
    object,
  } = useGenericListObject({ qFieldDefs: [fieldName] });

  const options = useMemo<FilterObjectOption[]>(() => (data || []).map(toOption), [data]);

  const handleEndSelections = (accept: boolean) => object?.endSelections(accept);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      object?.beginSelections(["/qListObjectDef"]);
    } else {
      handleEndSelections(true);
      object?.abortListObjectSearch("/qListObjectDef");
    }
    setIsPopoverOpen(isOpen);
  };

  const selectedValues = options
    .filter((option) => option.selected)
    .map((option) => option.value);

  const toggleOption = (option: FilterObjectOptionValue) => {
    const isSelected = selectedValues.some(v => v.qElemNumber === option.qElemNumber);
    const newSelections = isSelected
      ? selectedValues.filter(v => v.qElemNumber !== option.qElemNumber).map(v => v.qElemNumber)
      : [...selectedValues.map(v => v.qElemNumber), option.qElemNumber];

    object?.selectListObjectValues("/qListObjectDef", newSelections, false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button 
          className="p-1 hover:bg-accent rounded-md transition-colors flex-shrink-0"
          title={`Filtrar ${label}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Search className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[250px] p-0 overflow-hidden bg-popover border-gray-200 dark:border-border border shadow-md z-[100]" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <VirtualizedList
          options={options}
          handleSearch={(search) => object?.searchListObjectFor("/qListObjectDef", `*${search}*`)}
          handleAcceptSearch={() => object?.acceptListObjectSearch("/qListObjectDef", true)}
          toggleOption={toggleOption}
          isFetching={isFetching ?? false}
          hasMoreData={hasMoreData ?? false}
          handleGetNextPage={getNextPage}
        />
        <ButtonMenu
          handleSetPopoverOpen={handleOpenChange}
          handleSelectPossible={() => object?.selectListObjectPossible("/qListObjectDef")}
          handleSelectAlternative={() => object?.selectListObjectAlternative("/qListObjectDef")}
          handleSelectExcluded={() => object?.selectListObjectExcluded("/qListObjectDef")}
          hasAlternative={(layout?.qListObject?.qDimensionInfo?.qStateCounts?.qAlternative ?? 0) > 0}
          hasExcluded={(layout?.qListObject?.qDimensionInfo?.qStateCounts?.qExcluded ?? 0) > 0}
          hasPossible={(layout?.qListObject?.qDimensionInfo?.qStateCounts?.qOption ?? 0) > 0}
          handleEndSelections={handleEndSelections}
          handleClear={() => object?.clearSelections("/qListObjectDef")}
          handleSelectAll={() => object?.selectListObjectAll("/qListObjectDef")}
        />
      </PopoverContent>
    </Popover>
  );
};
