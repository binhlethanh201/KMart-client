import React from 'react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';

export default function RequestDetail() {
  useDocumentTitle('Chi tiết yêu cầu: Xin về sớm (#REQ-1042)');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background h-full overflow-hidden">
      
      {/* Enterprise Header Area */}
      <header className="bg-surface border-b border-outline-variant flex-shrink-0 z-20">
        {/* Top App Bar with Breadcrumbs */}
        <div className="h-12 px-6 flex items-center border-b border-outline-variant/50">
          <nav className="flex text-sm text-secondary font-body-md" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2">
              <li className="inline-flex items-center">
                <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">home</span>
                  Trang chủ
                </a>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-[16px] text-outline mx-1">chevron_right</span>
                  <a href="#" className="hover:text-primary transition-colors">Yêu cầu &amp; Phê duyệt</a>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-[16px] text-outline mx-1">chevron_right</span>
                  <span className="text-on-surface font-medium">Chi tiết #REQ-1042</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Action Header */}
        <div className="px-6 py-4 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display-lg text-2xl text-on-surface">Đơn xin về sớm</h1>
              <span className="bg-warning-container text-on-warning-container text-xs font-bold px-2 py-0.5 rounded border border-warning/20 uppercase tracking-wide">
                Đang chờ duyệt
              </span>
            </div>
            <p className="font-body-md text-secondary text-sm">
              Mã hệ thống: <strong>#REQ-1042</strong> • Đã nộp: 26/08/2026 09:00 AM
            </p>
          </div>
          
          {/* Strict Hierarchy Approval Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 py-1.5 rounded text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">print</span>
              In / Xuất PDF
            </button>
            <div className="w-px h-6 bg-outline-variant mx-1"></div>
            <button className="px-4 py-1.5 rounded text-sm font-medium border border-error text-error hover:bg-error-container transition-colors flex items-center gap-2 bg-surface">
              <span className="material-symbols-outlined text-[16px]">close</span>
              Từ chối
            </button>
            <button className="px-4 py-1.5 rounded text-sm font-medium border border-warning text-warning hover:bg-warning-container transition-colors flex items-center gap-2 bg-surface">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Yêu cầu bổ sung
            </button>
            <button className="px-5 py-1.5 rounded text-sm font-medium bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 border border-transparent shadow-sm">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Duyệt yêu cầu
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: 2-Column Corporate Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-surface-container-low">
        
        {/* Left Column: Request Data & Discussion (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-outline-variant">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Enterprise Information Block */}
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">feed</span>
                <h2 className="font-headline-sm text-sm text-on-surface uppercase tracking-wide">Chi tiết Đề xuất</h2>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm border-collapse">
                  <tbody className="divide-y divide-outline-variant">
                    <tr>
                      <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest w-1/3 align-top border-r border-outline-variant">Người đề xuất</th>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img className="w-8 h-8 rounded-full border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2yQM8EpgFrvByN-zTiJc7v45eW9LhVKoZ5z2znX-o6xWhfYuS3MF_Zp4oFspgbI_pYqPk5WesV09r6yLEZSSHgNS2xBoGADpZcGo7uOeq8R1XtrgnxNJMcMWoZDKBKazM7wMm9AZ5YS5wtjen2z6WtkIK4E41Fwf0-XFh9ylLZ-zgkkmscJhuskVFro1orhogKwqEsGvtsWGAQJRu57LyYBOCfGU9kEUWQyOlQx6A9h-5k5yZaN4vGw" alt="Avatar" />
                          <div>
                            <p className="font-medium text-on-surface">Hoàng Lâm Anh (EMP-8241)</p>
                            <p className="text-xs text-secondary">Nhân viên Thu ngân • Kmart Siêu thị Cầu Giấy</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">Loại đơn từ</th>
                      <td className="py-3 px-4 text-on-surface">Đi muộn / Về sớm (Nghỉ phép có lý do)</td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">Thời gian áp dụng</th>
                      <td className="py-3 px-4 text-on-surface">Ngày 26/08/2026 • Từ 14:00 đến 17:30 (3.5 giờ)</td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">Lý do cụ thể</th>
                      <td className="py-3 px-4 text-on-surface">
                        Việc gia đình cần giải quyết gấp vào buổi chiều (nhà trường gọi đón con do ốm đột xuất). Đã bàn giao ca làm việc cho Nguyễn Văn Phụ Tá. Mong ban giám đốc siêu thị tạo điều kiện.
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 font-medium text-secondary bg-surface-container-lowest align-top border-r border-outline-variant">Tài liệu đính kèm</th>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <a href="#" className="inline-flex items-center gap-2 border border-outline-variant rounded bg-surface px-3 py-1.5 text-sm hover:border-primary transition-colors text-on-surface group">
                            <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary">attach_file</span>
                            giay_xac_nhan.pdf (1.2 MB)
                          </a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Comment Thread */}
            <section className="bg-surface border border-outline-variant rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
                <h2 className="font-headline-sm text-sm text-on-surface uppercase tracking-wide">Lịch sử Thảo luận</h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Message */}
                <div className="flex gap-3">
                  <img alt="User" className="w-8 h-8 rounded-full border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh1ygQwSXp0icdwi3YxjWlf6PNhOL5c6_DUIGrOwKCqGGv9euYAWS8npuuOUcznxljdT30qToRyYKe-jMxNGnuEn5YyjjKw8dCaRvtMVExX1Kijwoz-PqZsTAGEfROqeYrJKSIbayRFhPbPnBwZPlFcuP7yCajAy_l6dEP3P2FyquAzHTLzoKiZv-xf761zz6Q7HCsJtus3quTJAMu4OV8OUdRjJtPtP9COPlmT2UFf-HmmYud3Aq9Sw" />
                  <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-md p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-on-surface">Trần Văn Quản Lý (Store Manager)</span>
                      <span className="text-xs text-secondary">26/08/2026 10:45 AM</span>
                    </div>
                    <p className="text-sm text-on-surface">Đã nhận được thông tin bàn giao ca. Anh duyệt bước 1. Khối HR check lại định mức phép năm của bạn này nhé.</p>
                  </div>
                </div>
              </div>
              {/* Internal Note Input */}
              <div className="bg-surface-container-low p-4 border-t border-outline-variant">
                <textarea className="w-full border border-outline-variant rounded-md p-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none min-h-[80px]" placeholder="Nhập ghi chú nội bộ hoặc thảo luận (có thể @mention)..."></textarea>
                <div className="flex justify-between items-center mt-2">
                  <button className="text-secondary hover:text-primary transition-colors p-1 flex items-center gap-1 text-sm font-medium">
                    <span className="material-symbols-outlined text-[18px]">attach_file</span> Đính kèm
                  </button>
                  <button className="bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container px-4 py-1.5 rounded text-sm font-medium transition-colors">
                    Gửi phản hồi
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Right Column: Workflow, Hierarchy & Audit Trail */}
        <div className="w-full lg:w-[360px] bg-surface flex-shrink-0 flex flex-col z-0 overflow-y-auto">
          
          {/* Action Reminder Banner */}
          <div className="bg-warning-container/30 border-b border-warning/20 p-4">
            <h3 className="text-xs font-bold text-warning uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              YÊU CẦU HÀNH ĐỘNG
            </h3>
            <p className="text-sm text-on-surface">Đơn vị Nhân sự Hội sở cần duyệt bước cuối. Hạn chót: <strong>Trong ngày</strong>.</p>
          </div>

          {/* Workflow Chain */}
          <div className="p-6 border-b border-outline-variant">
            <h3 className="font-headline-sm text-xs text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">account_tree</span>
              Cấp bậc Phê duyệt
            </h3>
            <div className="relative">
              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-outline-variant z-0"></div>
              <ul className="space-y-5 relative z-10">
                {/* Employee Node */}
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[12px] text-secondary">person</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary uppercase tracking-wide">Người nộp đơn</p>
                    <p className="text-sm text-on-surface font-medium mt-0.5">Hoàng Lâm Anh</p>
                  </div>
                </li>
                {/* Store Manager Node */}
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success text-on-success flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[12px]">check</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-success uppercase tracking-wide">Quản lý trực tiếp (Cấp 1)</p>
                    <p className="text-sm text-on-surface font-medium mt-0.5">Trần Văn Quản Lý</p>
                    <p className="text-xs text-success font-medium mt-0.5">Đã duyệt (26/08 10:15)</p>
                  </div>
                </li>
                {/* Corporate HR Node */}
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-warning border border-warning-container text-on-warning flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ring-2 ring-warning/20">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                  </div>
                  <div className="bg-warning-container/20 p-2 rounded border border-warning/20 w-full mt-[-4px]">
                    <p className="text-xs font-bold text-warning uppercase tracking-wide">Nhân sự Hội sở (Cấp 2)</p>
                    <p className="text-sm text-on-surface font-medium mt-0.5">Lê Hàn Tuệ Lâm (Bạn)</p>
                    <p className="text-xs text-warning font-medium mt-0.5">Đang chờ xử lý</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Audit Trail / History Logging */}
          <div className="p-6">
            <h3 className="font-headline-sm text-xs text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">history</span>
              Nhật ký hệ thống
            </h3>
            <ul className="space-y-3">
              <li className="text-xs text-secondary border-l-2 border-outline-variant pl-3 py-1">
                <span className="font-medium text-on-surface">10:45 AM</span> - Trần Văn Quản Lý đã thêm bình luận.
              </li>
              <li className="text-xs text-secondary border-l-2 border-success pl-3 py-1 bg-success-container/10">
                <span className="font-medium text-on-surface">10:15 AM</span> - Trần Văn Quản Lý đã thay đổi trạng thái thành <strong>Đã duyệt</strong>.
              </li>
              <li className="text-xs text-secondary border-l-2 border-outline-variant pl-3 py-1">
                <span className="font-medium text-on-surface">09:00 AM</span> - Hoàng Lâm Anh đã tạo yêu cầu <strong>#REQ-1042</strong>. Gửi email thông báo cho cấp quản lý.
              </li>
            </ul>
          </div>

        </div>

      </main>
    </div>
  );
}
