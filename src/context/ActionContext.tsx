'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ActionContextType {
    selectedItems: Set<string>;
    isAllSelected: boolean;
    currentFilters: any;
    toggleItem: (id: string) => void;
    toggleSelectAllPage: (pageIds: string[]) => void;
    setSelectAllGlobal: (selected: boolean, filters?: any) => void;
    clearSelection: () => void;
    selectionCount: number;
    actionBoardItems: Set<string>;
    addToActionBoard: (ids: string[]) => void;
    removeFromActionBoard: (ids: string[]) => void;
    refreshActionBoard: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export function ActionProvider({ children }: { children: ReactNode }) {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    // isAllSelected means "All matching filters are selected" (server-side scope)
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<any>({});
    // We might need total count to show "All X items selected"
    const [actionBoardItems, setActionBoardItems] = useState<Set<string>>(new Set());

    // Load initial state
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/items`);
                if (res.ok) {
                    const ids = await res.json();
                    setActionBoardItems(new Set(ids));
                }
            } catch (e) {
                console.error("Failed to fetch action items", e);
            }
        };
        fetchItems();
    }, []);

    const addToActionBoard = async (ids: string[]) => {
        try {
            // Optimistic Update
            const newSet = new Set(actionBoardItems);
            ids.forEach(id => newSet.add(id));
            setActionBoardItems(newSet);

            // API Call
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
        } catch (e) {
            console.error("Failed to add to action board", e);
            // Revert optimistic update if API call fails (optional, but good practice)
            setActionBoardItems(prev => {
                const revertedSet = new Set(prev);
                ids.forEach(id => revertedSet.delete(id));
                return revertedSet;
            });
        }
    };

    const removeFromActionBoard = async (ids: string[]) => {
        try {
            // Optimistic Update
            const newSet = new Set(actionBoardItems);
            ids.forEach(id => newSet.delete(id));
            setActionBoardItems(newSet);

            // API Call
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/remove`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
        } catch (e) {
            console.error("Failed to remove from action board", e);
            // Revert optimistic update if API call fails (optional, but good practice)
            setActionBoardItems(prev => {
                const revertedSet = new Set(prev);
                ids.forEach(id => revertedSet.add(id));
                return revertedSet;
            });
        }
    };

    // New Method for Bulk Add (refresh state after)
    const refreshActionBoard = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/actions/items`);
            if (res.ok) {
                const ids = await res.json();
                setActionBoardItems(new Set(ids));
            }
        } catch (e) {
            console.error("Refresh failed", e);
        }
    };

    const toggleItem = (id: string) => {
        if (isAllSelected) {
            // If we are in "All Selected" mode, deselecting one item switches us to manual mode?
            // Or we track "excludedItems"? For simplicity V1: Switch to manual set if feasible, 
            // or just warn user "Deselecting this will clear 'Select All' mode".
            // Let's go with: Switch to manual mode is hard if we don't know all IDs. 
            // Better strategy: "Excluded" set (advanced) or just Clear All Global and add individual (simple).
            // For MVP: Deselecting an item while All Selected -> Clears All Selected first? 
            // Let's implement simple set logic first: 
            // If All Selected is true, we ideally track exclusions. 
            // BUT user requirement is just "Select All". 
            // Let's stick to Set<string> for manual selection. 
            // If "Select All Global" is active, we just assume ALL are selected and ignore selectedItems set?
            // User asked: "Select all (include all other list in other pagination pages)"
            // Implementation: We will use `isAllSelected` flag. If true, backend will receive the filter object instead of ID list.

            // If user unchecks a box while `isAllSelected` is true:
            // We'll simplisticly turn off `isAllSelected` and clear selection (or require user to explicitly Clear All).
            // UX Pattern: Usually "Select All" has a banner "All 20 on page selected. Select all 500?". 
            // If they click "Select all 500", we set `isAllSelected = true`.
            // If they then uncheck one row, we usually revert to "499 selected" which implies we need to know all IDs 
            // or track exclusions. 
            // To save time: If isAllSelected is true, unchecking an item adds it to an `excludedItems` set.
            // AND we treat `selectedItems` as empty in this mode usually? 
            // Let's keep it simple: 
            // If isAllSelected = true, show warning or just disable individual uncheck? 
            // Or just allow uncheck and switch to "All except..."
            // Let's try: toggleItem just works on the manual set. 
            // If isAllSelected is true, we need to handle "exclusion". 
            // Let's create `excludedItems` state.
        }

        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

        // If we were in global mode and touched an item, we complicated things. 
        // For this iteration, let's keep it simple: 
        // We will separate "Manual Selection" and "Global Selection".
        // If Global is active, we don't strictly support "All except 1". 
        // If user unchecks, we turn off Global and they have to re-select what they want.
        if (isAllSelected) setIsAllSelected(false);
    };

    const toggleSelectAllPage = (pageIds: string[]) => {
        // If all pageIds are in selectedItems, remove them.
        // Else add missing ones.
        const allIn = pageIds.every(id => selectedItems.has(id));

        setSelectedItems(prev => {
            const next = new Set(prev);
            if (allIn) {
                pageIds.forEach(id => next.delete(id));
            } else {
                pageIds.forEach(id => next.add(id));
            }
            return next;
        });

        if (isAllSelected) setIsAllSelected(false);
    };

    const setSelectAllGlobal = (selected: boolean, filters: any = {}) => {
        setIsAllSelected(selected);
        if (selected) {
            setCurrentFilters(filters);
            // Optionally clear manual set to avoid confusion, or keep it as "visible selected".
            // Actually, if Global is true, we should conceptually have everything selected.
            // But visually on the page, the checkboxes need to be checked.
            // so we rely on `isAllSelected` being passed to the row to force checked state?
            // Yes.
        } else {
            setCurrentFilters({});
        }
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
        setIsAllSelected(false);
        setCurrentFilters({});
    };

    const selectionCount = isAllSelected ? 999999 : selectedItems.size; // 999999 is placeholder, we need to store total count

    return (
        <ActionContext.Provider value={{
            selectedItems,
            isAllSelected,
            currentFilters,
            toggleItem,
            toggleSelectAllPage,
            setSelectAllGlobal,
            clearSelection,
            selectionCount: selectedItems.size,
            actionBoardItems,
            addToActionBoard,
            removeFromActionBoard,
            refreshActionBoard
        }}>
            {children}
        </ActionContext.Provider>
    );
}

export function useActionContext() {
    const context = useContext(ActionContext);
    if (!context) throw new Error('useActionContext must be used within ActionProvider');
    return context;
}
