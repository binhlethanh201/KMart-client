import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../../i18n/I18nProvider';
import ImportExcelModal from './ImportExcelModal';
import { userService } from '../services/userService';

vi.mock('../services/userService', () => ({
  userService: {
    importExcelDryRun: vi.fn(),
    importExcelCommit: vi.fn(),
    getImportJobStatus: vi.fn(),
    downloadImportCredentials: vi.fn(),
  },
}));

const DRY_RUN_REPORT = {
  totalRowsRead: 733,
  employeeRowsParsed: 648,
  uniqueUsersAfterMerge: 644,
  departmentsToCreate: 65,
  departmentsMatchedExisting: 23,
  usersToCreate: 644,
  usersToUpdate: 0,
  mergedConcurrentUsers: [
    { employeeCode: 'K200673', fullName: 'Nguyễn Kiều Trang', units: ['KM Charmvit', 'Phòng vận hành_Team 3'] },
  ],
  regionsWithoutManager: ['Khu vực Đà Nẵng'],
  warnings: [
    { row: 318, code: 'UNIT_TYPO_FIXED', message: 'Đã sửa tên đơn vị' },
    { row: 716, code: 'DUPLICATE_EMP_CODE', message: 'Trùng mã nhân viên' },
  ],
};

const makeFile = () => new File(['dummy'], 'nhan-su.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

const renderModal = (onClose = vi.fn()) =>
  render(
    <I18nProvider>
      <ImportExcelModal onClose={onClose} />
    </I18nProvider>
  );

const pickFile = (file) => {
  fireEvent.change(screen.getByLabelText('File Excel (.xlsx)'), { target: { files: [file] } });
};

describe('ImportExcelModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nút xác nhận bị vô hiệu hoá khi chưa xem trước thành công', () => {
    renderModal();
    const confirm = screen.getByRole('button', { name: /Xác nhận cập nhật/i });
    expect(confirm).toBeDisabled();
    expect(userService.importExcelCommit).not.toHaveBeenCalled();
  });

  it('dry-run hiển thị số liệu đối soát và cảnh báo', async () => {
    userService.importExcelDryRun.mockResolvedValue(DRY_RUN_REPORT);
    renderModal();

    pickFile(makeFile());

    await waitFor(() => expect(screen.getByText('733')).toBeInTheDocument());
    expect(screen.getByText('648')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Kiều Trang')).toBeInTheDocument();
    expect(screen.getByText(/KM Charmvit, Phòng vận hành_Team 3/)).toBeInTheDocument();
    expect(screen.getByText('Khu vực Đà Nẵng')).toBeInTheDocument();
    // Cảnh báo gom theo mã
    expect(screen.getByText(/UNIT_TYPO_FIXED/i)).toBeInTheDocument();
    expect(screen.getByText(/Dòng 318/)).toBeInTheDocument();
    expect(screen.getByText(/Dòng 716/)).toBeInTheDocument();
    // Nút xác nhận mở khoá sau khi preview thành công
    expect(screen.getByRole('button', { name: /Xác nhận cập nhật/i })).toBeEnabled();
  });

  it('dừng hỏi trạng thái khi job completed và hiện nút tải mật khẩu', async () => {
    userService.importExcelDryRun.mockResolvedValue(DRY_RUN_REPORT);
    userService.importExcelCommit.mockResolvedValue({ jobId: 'job-1', status: 'queued' });
    userService.getImportJobStatus.mockResolvedValue({
      jobId: 'job-1',
      status: 'completed',
      phase: 'done',
      processedUsers: 644,
      totalUsers: 644,
      createdUsers: 644,
      updatedUsers: 0,
      createdDepartments: 65,
      hasCredentialsFile: true,
      error: null,
    });
    renderModal();

    pickFile(makeFile());
    await waitFor(() => expect(screen.getByRole('button', { name: /Xác nhận cập nhật/i })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /Xác nhận cập nhật/i }));

    await waitFor(() => expect(screen.getByText(/Nhập dữ liệu hoàn tất/i)).toBeInTheDocument());
    // completed -> không hỏi lại trạng thái nữa (ngừng polling).
    await new Promise((r) => setTimeout(r, 50));
    expect(userService.getImportJobStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /Tải file mật khẩu/i })).toBeInTheDocument();
  });

  it('ẩn nút tải mật khẩu khi hasCredentialsFile = false', async () => {
    userService.importExcelDryRun.mockResolvedValue(DRY_RUN_REPORT);
    userService.importExcelCommit.mockResolvedValue({ jobId: 'job-2', status: 'queued' });
    userService.getImportJobStatus.mockResolvedValue({
      jobId: 'job-2',
      status: 'completed',
      phase: 'done',
      processedUsers: 10,
      totalUsers: 10,
      createdUsers: 10,
      updatedUsers: 0,
      createdDepartments: 0,
      hasCredentialsFile: false,
      error: null,
    });
    renderModal();

    pickFile(makeFile());
    await waitFor(() => expect(screen.getByRole('button', { name: /Xác nhận cập nhật/i })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /Xác nhận cập nhật/i }));

    await waitFor(() => expect(screen.getByText(/Nhập dữ liệu hoàn tất/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Tải file mật khẩu/i })).not.toBeInTheDocument();
  });

  it('hiện lỗi khi job failed', async () => {
    userService.importExcelDryRun.mockResolvedValue(DRY_RUN_REPORT);
    userService.importExcelCommit.mockResolvedValue({ jobId: 'job-3', status: 'queued' });
    userService.getImportJobStatus.mockResolvedValue({
      jobId: 'job-3',
      status: 'failed',
      phase: 'committing',
      error: 'Lỗi kết nối CSDL',
    });
    renderModal();

    pickFile(makeFile());
    await waitFor(() => expect(screen.getByRole('button', { name: /Xác nhận cập nhật/i })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: /Xác nhận cập nhật/i }));

    await waitFor(() => expect(screen.getByText('Lỗi kết nối CSDL')).toBeInTheDocument());
    expect(userService.getImportJobStatus).toHaveBeenCalledTimes(1);
  });
});
