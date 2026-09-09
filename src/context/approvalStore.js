import { createContext } from 'react';

// Shared context object. Kept in its own non-component file so the provider
// file exports only a component (clean fast-refresh).
export const ApprovalSystemContext = createContext(null);
