import { createContext } from 'react';

export const ChartSearchContext = createContext<{
  setSearch: (search: string) => void;
}>({
  setSearch: () => {},
});
