import { useState, type ButtonHTMLAttributes } from "react";

import type {
  FilterObjectOption,
  FilterObjectOptionValue,
} from "./@types/types";
import { Trigger } from "./components/Trigger/Trigger";
import { Popover, PopoverContent, PopoverTrigger } from "../shadcn/popover";
import { Button } from "../shadcn/button";
import { cn } from "@/shared/utils/tailwind/cn";
import { ButtonMenu } from "./components/ButtonMenu/ButtonMenu";
import { VirtualizedList } from "./components/VirtualList/VirtualizedList";

export interface FilterObjectProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "defaultValue"> {
  options: FilterObjectOption[];
  onValueChange: (value: FilterObjectOptionValue[]) => void;
  handleSearch: (searchString: string) => void;
  handleAcceptSearch: () => void;
  handleCancelSearch: () => void;
  label: string;
  modalPopover?: boolean;
  className?: string;
  isFetching?: boolean;
  hasMoreData?: boolean | null;
  isLoadingMore?: boolean;
  error?: string | null;
  handleGetNextPage?: () => void;
  /** Seleciona todas as opções, inclusive as ainda não renderizadas */
  handleSelectAll?: () => void;
  handleClearAll?: () => void;
  handleSelectPossible: () => void;
  handleSelectAlternative: () => void;
  handleSelectExcluded: () => void;
  handleBeginSelections: () => void;
  handleEndSelections: (accept: boolean) => void;
  hasAlternative: boolean;
  hasExcluded: boolean;
  hasPossible: boolean;
  resetKey?: number;
}

export const FilterObject = (
    {
      options,
      handleSearch,
      handleAcceptSearch,
      handleCancelSearch,
      handleBeginSelections,
      handleEndSelections,
      onValueChange,
      label,
      modalPopover = false,
      className,
      isFetching = false,
      isLoadingMore = false,
      error = null,
      hasMoreData = false,
      handleGetNextPage,
      handleSelectAll,
      handleClearAll,
      handleSelectPossible,
      handleSelectAlternative,
      handleSelectExcluded,
      hasAlternative,
      hasExcluded,
      hasPossible,
      resetKey,
      ...props
    }: FilterObjectProps) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
      if (isOpen) {
        handleBeginSelections();
      } else {
        handleEndSelections(true);
        handleCancelSearch();
      }
      setIsPopoverOpen(isOpen);
    };

    // Deduplicate selected values by `qElemNumber` to avoid double-counts
    // when the options list contains duplicated rows from paging or search.
    const selectedValues = Array.from(
      new Map(
        options
          .filter((option) => option.selected)
          .map((option) => [option.value.qElemNumber, option.value]),
      ).values(),
    );

    const toggleOption = (option: FilterObjectOptionValue) => {
      const newSelectedValues = selectedValues
        .map((value) => value.qElemNumber)
        .includes(option.qElemNumber)
        ? selectedValues.filter(
          (value) => value.qElemNumber !== option.qElemNumber,
        )
        : [...selectedValues, option];
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      if (handleClearAll) {
        handleClearAll();
      } else {
        onValueChange([]);
      }
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={handleOpenChange}
        modal={modalPopover}
      >
        <PopoverTrigger asChild={true}>
          <Button
            {...props}
            className={cn(
              "bg-sidebar border-input text-foreground hover:bg-accent flex w-full cursor-pointer items-center justify-start rounded-md border px-3 py-2 shadow-sm [&_svg]:pointer-events-auto",
              className,
            )}
          >
            <Trigger
              label={label}
              isOpen={isPopoverOpen}
              selectedCount={selectedValues.length}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="bg-popover border-gray-200 dark:border-border border p-0 shadow-md"
        >
          <ButtonMenu
            handleSetPopoverOpen={handleOpenChange}
            handleSelectPossible={handleSelectPossible}
            handleSelectAlternative={handleSelectAlternative}
            handleSelectExcluded={handleSelectExcluded}
            hasAlternative={hasAlternative}
            hasExcluded={hasExcluded}
            hasPossible={hasPossible}
            handleEndSelections={handleEndSelections}
            handleClear={() => {
              handleClear();
              handleOpenChange(false);
            }}
            handleSelectAll={handleSelectAll}
          />
          <VirtualizedList
            options={options}
            handleSearch={handleSearch}
            handleAcceptSearch={handleAcceptSearch}
            toggleOption={toggleOption}
            isFetching={isFetching}
            isLoadingMore={isLoadingMore}
            error={error}
            hasMoreData={hasMoreData}
            handleGetNextPage={handleGetNextPage}
            resetKey={resetKey}
          />
        </PopoverContent>
      </Popover>
    );
};
