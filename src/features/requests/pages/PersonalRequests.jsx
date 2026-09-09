import React from 'react';
import RequestCard from '../components/RequestCard';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

export default function PersonalRequests() {
  useDocumentTitle('Đơn từ cá nhân');

  const requests = [
    {
      id: '#REQ-2023-1042',
      status: 'approved',
      title: 'Xin nghỉ phép về quê',
      date: '24/08/2026',
      department: 'Nhân sự',
      metaLabel: 'Loại',
      metaValue: 'Nghỉ phép năm',
      statusLabel: 'Đã phê duyệt',
      icon: 'check_circle',
      iconBg: 'bg-success-container',
      iconColor: 'text-success',
      statusBadgeBg: 'bg-success-container',
      statusBadgeColor: 'text-on-success-container',
      statusBadgeBorder: 'border-success',
      isFavorite: true,
      approvers: [
        {
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4F8WPdcumqAW4TsDapO2w034gH2-t9AO01Z4fUOhS8hMRVnjowLQNlgAeARlW9swMmJTo9asfLAAXtK530iRsrq6zxe8WtAI4E_5V2ta3k6h1yGb8AxD6jjoZ56Sbt6Kf4oa0tvBrdZ81Z6jLfv95AQSMh-Y3RCHLNZIyJfrlGQFBFL3MZTfMbosoCgXVvzgBhUunrNGgeZm6wOQzh0fW47jvpM8LgdSPOHCHpNNSyNoTCXIwzZ8aBw',
          statusIcon: 'check',
          statusIconBg: 'bg-success'
        },
        {
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaC1M1nYSCTyFw5krUnP7nktVXkbFReo_PG6Q0QT4Jp0Jl1D3FS71J0sfunslk17aZkVcF8l87RQq-jzvWkoDmJbteULjW66v6zkDYU0x-o6OOygLcngVFtrymWwSNOLiJHh2sJSJBf9hWwNWOck3AX-sQbDUc7itUHPFXD5U1hzKw3lSCnIYzwiyMXGm2FN40789AG07ZxKfhJPP-v__InKvHPc-44ZvGUAIcXcC2xAJraBb9y5wjMg',
          statusIcon: 'check',
          statusIconBg: 'bg-success'
        }
      ]
    },
    {
      id: '#REQ-2023-1045',
      status: 'pending',
      title: 'Mua văn phòng phẩm tháng 11',
      date: '23/08/2026',
      department: 'Hành chính',
      metaLabel: 'Tổng tiền',
      metaValue: '2,500,000đ',
      statusLabel: 'Chờ duyệt (Bạn)',
      icon: 'schedule',
      iconBg: 'bg-warning-container',
      iconColor: 'text-warning',
      statusBadgeBg: 'bg-warning-container',
      statusBadgeColor: 'text-on-warning-container',
      statusBadgeBorder: 'border-warning',
      isFavorite: false,
      approvers: [
        {
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxcOUvOanXvFrCu-cB92LQ9fREu3GippoasyPNIsVecqvmQS2_vf-sQ6jUtVd7rdRkXNv7Vd4mnDpcDK5WO3mlYJEjWUH1DXJovI1IsQmsAryczHTpoRD82cz_ePf6xKTclD0p4DUVcvFbmXEksRJeIvxske_4zM73b1MRYtmNSQ1RdnBVYx5HelSx5Hc_wfiQhn6mjDqtczkWhtu9Tr4XwncuSWP6A5yE34BrivlpPRoXh0zngrS9PQ',
          statusIcon: 'check',
          statusIconBg: 'bg-success'
        },
        {
          isCurrentUser: true,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpd-a7S68cC6pmJdeau9eKmaKEjspeDNfx0D1d7B908ssyvKGCK3MS3nsjdwZST1C20qiZb0jeJfAU2ZKMtIL29DECuc-yAOdReutZ8H2P3kUUuA0g6ZT3wafKdSa9jGsPlfHqFUmyciDPEPTXx57vD1qXcL9rNijsxfSMYFaoA8XUyeBfY6wrI-qzVadb2xtRnYMe3_zNRRQM2WyUZttfpyEUKifR6Qs6Ou4Ke53cIwnYQfrSyEpV3A'
        }
      ]
    },
    {
      id: '#REQ-2023-0988',
      status: 'rejected',
      title: 'Book vé máy bay đi công tác HCM',
      date: '21/08/2026',
      department: 'Kinh doanh',
      metaLabel: 'Lý do',
      metaValue: 'Vượt ngân sách quy định',
      statusLabel: 'Từ chối',
      icon: 'close',
      iconBg: 'bg-error-container',
      iconColor: 'text-error',
      statusBadgeBg: 'bg-error-container',
      statusBadgeColor: 'text-on-error-container',
      statusBadgeBorder: 'border-error',
      isFavorite: false,
      approvers: [
        {
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzwBtZniefNoZtxuHEt9-phXzliOGPKvosGgnaIkpiuS6GBKz_YJc2h9k2IOoTJMyB61kVcupzuiXZgPnic_qGuRrD7MwzbBAe419QBwgzDKFbVhX2WWYKzTCAY4X7lZ584Hh8sSF9YfZwuXPTV7dbTbOSFif4xgcqd-NA4Lz3sYJkLgqJrMLcJaRxfUa2BuEOZkLhkve509W7HNTS2mrnW-EfZ5wYwNXDompk24z4VbRgaUPfwFAqiw',
          statusIcon: 'close',
          statusIconBg: 'bg-error'
        }
      ]
    }
  ];

  return (
    <section className="flex-1 flex flex-col h-full overflow-hidden relative bg-surface-container-lowest">
      {/* Enterprise Functional Header */}
      <div className="bg-surface border-b border-outline-variant p-6 flex-shrink-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-on-surface mb-1 tracking-tight">Danh sách Đơn từ &amp; Đề xuất</h1>
            <p className="font-body-md text-secondary">
              Quản lý, theo dõi và phê duyệt các yêu cầu nhân sự trong toàn hệ thống siêu thị.
            </p>
          </div>
          <button className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors font-label-md px-5 py-2.5 rounded-lg shadow flex items-center gap-2 self-start md:self-auto">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tạo đề xuất mới
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-background">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
          {/* Action Bar / Filters */}
          <div className="bg-surface p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between border border-outline-variant shadow-sm sticky top-0 z-20">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
              <input 
                className="w-full pl-9 pr-3 py-2 rounded-md border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm text-on-surface placeholder:text-secondary outline-none" 
                placeholder="Tìm kiếm theo mã đơn, nhân viên..." 
                type="text" 
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select className="px-3 py-2 bg-surface border border-outline-variant rounded-md font-label-md text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm">
                <option>Sắp xếp: Mới nhất</option>
                <option>Sắp xếp: Cũ nhất</option>
              </select>
              <button className="px-3 py-2 bg-surface border border-outline-variant rounded-md flex items-center gap-1 hover:bg-surface-container-low transition-colors font-label-md text-sm text-secondary shadow-sm">
                <span className="material-symbols-outlined text-[18px]">filter_list</span> 
                Bộ lọc
              </button>
            </div>
          </div>

          {/* Data List (Cards stack) */}
          <div className="flex flex-col gap-3 pb-8">
            {requests.map((req, idx) => (
              <RequestCard 
                key={idx}
                status={req.status}
                title={req.title}
                requestId={req.id}
                date={req.date}
                department={req.department}
                metaLabel={req.metaLabel}
                metaValue={req.metaValue}
                statusLabel={req.statusLabel}
                icon={req.icon}
                iconBg={req.iconBg}
                iconColor={req.iconColor}
                statusBadgeBg={req.statusBadgeBg}
                statusBadgeColor={req.statusBadgeColor}
                statusBadgeBorder={req.statusBadgeBorder}
                isFavorite={req.isFavorite}
                approvers={req.approvers}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
