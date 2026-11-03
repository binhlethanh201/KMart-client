import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../../i18n/I18nProvider';
import RequestCard from './RequestCard';

vi.mock('../../../context/useApproval', () => ({
  useApproval: () => ({
    canApprove: () => false,
    departments: [],
    currentUserId: 'me',
    cancelRequest: vi.fn(),
  }),
}));

vi.mock('../../hr/context/HrProvider', () => ({
  useHr: () => ({
    employees: [
      { id: 'u2', name: 'Trần Thị Bình', shortId: 'K241007', role: 'MANAGER', department: 'Phòng Kỹ thuật' },
    ],
  }),
}));

const PENDING_REQUEST = {
  id: 'r1',
  status: 'pending',
  creatorId: 'u1',
  creatorName: 'Lê Hải Dương',
  currentStep: 0,
  steps: [{ status: 'pending', approverId: 'u2', stepOrder: 1 }],
  histories: [],
};

describe('RequestCard — mã NV người duyệt', () => {
  it('hiện mã NV thật của người đang chờ duyệt trong khối tóm tắt', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <RequestCard request={PENDING_REQUEST} />
        </I18nProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('K241007')).toBeTruthy();
  });
});
