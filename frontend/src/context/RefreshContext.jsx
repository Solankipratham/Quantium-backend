import { createContext, useContext, useState } from "react";

const RefreshContext = createContext();

export function RefreshProvider({ children }) {
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshCount, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => useContext(RefreshContext);
