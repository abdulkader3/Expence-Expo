import React, { createContext, useContext, useRef, useCallback } from 'react';

interface SaveTriggerRef {
  triggerSave: () => void;
}

const SaveTriggerContext = createContext<React.MutableRefObject<SaveTriggerRef> | null>(null);

export function SaveTriggerProvider({ children }: { children: React.ReactNode }) {
  const saveTriggerRef = useRef<SaveTriggerRef>({ triggerSave: () => {} });
  
  return (
    <SaveTriggerContext.Provider value={saveTriggerRef}>
      {children}
    </SaveTriggerContext.Provider>
  );
}

export function useSaveTrigger() {
  const context = useContext(SaveTriggerContext);
  if (!context) {
    throw new Error('useSaveTrigger must be used within SaveTriggerProvider');
  }
  return context;
}
