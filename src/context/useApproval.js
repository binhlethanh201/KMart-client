import { useContext } from 'react';
import { ApprovalSystemContext } from './approvalStore';

export const useApproval = () => useContext(ApprovalSystemContext);
