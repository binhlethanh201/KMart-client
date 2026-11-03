import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nProvider } from '../../../i18n/I18nProvider';
import EmployeeModal from './EmployeeModal';

const DEPARTMENTS = [{ id: 'd1', name: 'Phòng HR' }];
const POSITIONS = [{ id: 'p1', name: 'Kế toán' }];
const ROLES = [{ id: 'r1', roleName: 'STAFF' }];

const renderModal = (props = {}) =>
  render(
    <I18nProvider>
      <EmployeeModal
        departments={DEPARTMENTS}
        positions={POSITIONS}
        roles={ROLES}
        currentUser={{ role: 'HR' }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        {...props}
      />
    </I18nProvider>
  );

/** Chọn một giá trị trong SearchableSelect (mở dropdown rồi bấm nút option). */
const pickOption = (testId, label) => {
  fireEvent.click(screen.getByTestId(testId));
  fireEvent.click(screen.getByRole('button', { name: label }));
};

const fillValidCreateForm = () => {
  fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn A' } });
  fireEvent.change(screen.getByLabelText('Email công ty'), { target: { value: 'a@ktm.vn' } });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Password123!' } });
  pickOption('department-select', 'Phòng HR');
  pickOption('position-select', 'Kế toán');
  pickOption('role-select', 'Nhân viên');
};

describe('EmployeeModal — mã nhân viên nhập tay', () => {
  it('hiện ô mã NV chỉnh sửa được ngay khi TẠO MỚI (trước đây chỉ có khối đọc khi sửa)', () => {
    renderModal();
    const input = screen.getByLabelText('Mã nhân viên');
    expect(input.tagName).toBe('INPUT');
    expect(input).not.toBeDisabled();
  });

  it('chặn mã sai định dạng và không gọi onSave', () => {
    const onSave = vi.fn();
    renderModal({ onSave });
    fillValidCreateForm();
    fireEvent.change(screen.getByLabelText('Mã nhân viên'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu thông tin/ }));

    expect(screen.getByText('Mã nhân viên không hợp lệ (dạng K250627: tiền tố chữ + dãy số)')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('gửi mã NV người dùng nhập khi tạo', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    renderModal({ onSave });
    fillValidCreateForm();
    fireEvent.change(screen.getByLabelText('Mã nhân viên'), { target: { value: 'K250627' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu thông tin/ }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].employeeCode).toBe('K250627');
  });

  it('khi sửa: điền sẵn mã cũ và gửi chuỗi rỗng khi người dùng xoá mã', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    renderModal({
      onSave,
      employee: {
        id: 'u1',
        name: 'Người Cũ',
        email: 'cu@ktm.vn',
        employeeCode: 'K160809',
        role: 'STAFF',
        departmentId: 'd1',
        positionId: 'p1',
      },
    });

    const input = screen.getByLabelText('Mã nhân viên');
    expect(input.value).toBe('K160809');

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu thông tin/ }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0].employeeCode).toBe('');
  });
});
