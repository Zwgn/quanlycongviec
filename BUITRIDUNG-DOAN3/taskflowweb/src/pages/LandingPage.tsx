import '../assets/styles/LandingPage.css';
import { useLandingPage } from '../hooks/useLandingPage';

const menuItems = [
  { label: 'Trang chủ', target: '#home' },
  { label: 'Giới thiệu', target: '#about' },
  { label: 'Dịch vụ', target: '#service' },
  { label: 'Liên hệ', target: '#contact' },
];

const featureItems = [
  {
    title: 'Workspace',
    description: 'Tổ chức đội nhóm trong Workspace rõ ràng và dễ quản lý quyền.',
  },
  {
    title: 'Project',
    description: 'Tạo dự án trong từng Workspace và theo dõi mục tiêu của dự án.',
  },
  {
    title: 'Kanban Board',
    description: 'Theo dõi tiến độ trực quan theo cột danh sách và tối ưu kế hoạch hằng ngày.',
  },
  {
    title: 'Task',
    description: 'Tạo, giao việc, đặt ưu tiên và di chuyển Task nhanh chóng.',
  },
  {
    title: 'Cộng tác',
    description: 'Bình luận, đính kèm tệp và xem lịch sử hoạt động của công việc.',
  },
];

const metricItems = [
  { value: '10k+', label: 'Công việc được theo dõi mỗi tuần' },
  { value: '95%', label: 'Đội nhóm phản hồi đúng hạn' },
  { value: '4 bước', label: 'Từ kế hoạch đến hoàn thành' },
  { value: '24/7', label: 'Theo dõi tiến độ mọi lúc' },
];

const processItems = [
  {
    title: 'Tạo Workspace',
    description: 'Khởi tạo Workspace, thêm thành viên và phân quyền theo vai trò.',
  },
  {
    title: 'Lập kế hoạch dự án',
    description: 'Tạo Project, Board và danh sách để chia nhỏ công việc theo giai đoạn.',
  },
  {
    title: 'Theo dõi và cộng tác',
    description: 'Giao việc, bình luận, đính kèm tệp và cập nhật trạng thái liên tục.',
  },
  {
    title: 'Đánh giá và cải tiến',
    description: 'Xem lịch sử hoạt động, đo lường hiệu suất và tối ưu quy trình.',
  },
];

type LandingPageProps = {
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenWorkspace: () => void;
};

// Trang giới thiệu và form liên hệ cho người dùng mới.
function LandingPage({
  isAuthenticated,
  onOpenLogin,
  onOpenRegister,
  onOpenWorkspace,
}: LandingPageProps) {
  const {
    formValues,
    formErrors,
    isSubmitted,
    handleInputChange,
    handleContactSubmit,
  } = useLandingPage();

  return (
    <div className="landing-root">
      <header className="landing-navbar">
        <div className="landing-logo">TASKFLOW</div>

        <nav className="landing-nav-menu" aria-label="Landing navigation">
          {menuItems.map((item) => (
            <a key={item.label} href={item.target}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <button
              type="button"
              className="landing-button landing-button--solid"
              onClick={onOpenWorkspace}
            >
              Đi đến bảng của bạn
            </button>
          ) : (
            <>
              <button
                type="button"
                className="landing-button landing-button--outline"
                onClick={onOpenRegister}
              >
                Đăng ký
              </button>
              <button
                type="button"
                className="landing-button landing-button--solid"
                onClick={onOpenLogin}
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </header>

      <main className="landing-shell">
        <section id="home" className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-hero-tag">Nền tảng quản lý đội nhóm</p>
            <h1 className="landing-hero-title">
              <span className="landing-hero-title-main">Ghi lại, sắp xếp và hoàn thành</span>
              <span className="landing-hero-title-sub">công việc cùng TaskFlow</span>
            </h1>
            <p className="landing-hero-description">
              Tập trung mọi việc cần làm vào một nơi: từ kế hoạch dự án, cộng tác
              theo thời gian thực đến theo dõi tiến độ trực quan trên bảng Kanban.
            </p>
            <a href="#about" className="landing-cta">
              Tìm hiểu thêm
            </a>

            <div className="landing-hero-points">
              <span>Kanban trực quan</span>
              <span>Drag & drop mượt</span>
              <span>Quản lý nhóm tập trung</span>
            </div>
          </div>
        </section>

        <section className="landing-metrics" aria-label="Số liệu nổi bật">
          {metricItems.map((item) => (
            <article key={item.label} className="landing-metric-card">
              <h3>{item.value}</h3>
              <p>{item.label}</p>
            </article>
          ))}
        </section>

        <section id="about" className="landing-section">
          <h2>Giới thiệu TaskFlow</h2>
          <p>
            TaskFlow giúp đội nhóm làm việc theo cấu trúc đơn giản: Workspace,
            Project, Board và Task. Mục tiêu là dễ theo dõi, rõ trách nhiệm và tăng
            tốc độ hoàn thành công việc.
          </p>

          <div className="landing-grid landing-grid--three">
            <article className="landing-card">
              <h3>Mục tiêu</h3>
              <p>Đơn giản hóa việc lập kế hoạch và giảm bỏ sót công việc.</p>
            </article>
            <article className="landing-card">
              <h3>Ý nghĩa</h3>
              <p>Xây dựng quy trình rõ ràng để mọi thành viên đều dễ theo dõi.</p>
            </article>
            <article className="landing-card">
              <h3>Lợi ích</h3>
              <p>Tăng hiệu quả phối hợp và minh bạch từ ý tưởng đến hoàn thành.</p>
            </article>
          </div>
        </section>

        <section className="landing-section">
          <h2>Quy trình làm việc với TaskFlow</h2>
          <p>
            Thiết kế theo mô hình tối giản để đội nhóm bắt đầu nhanh, theo dõi dễ và
            mở rộng linh hoạt theo từng giai đoạn phát triển.
          </p>

          <div className="landing-grid landing-grid--four">
            {processItems.map((item, index) => (
              <article key={item.title} className="landing-card landing-card--step">
                <span className="landing-step-number">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="service" className="landing-section">
          <h2>Tính năng</h2>
          <p>Các chức năng chính của TaskFlow trong quản lý Project và Task.</p>

          <div className="landing-grid landing-grid--five">
            {featureItems.map((item) => (
              <article key={item.title} className="landing-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--cta">
          <div>
            <h2>Sẵn sàng tăng tốc quy trình làm việc?</h2>
            <p>
              Bắt đầu với TaskFlow để chuẩn hóa cách đội nhóm lập kế hoạch, phối hợp
              và hoàn thành công việc đúng tiến độ.
            </p>
          </div>
          <div className="landing-cta-actions">
            <button type="button" className="landing-button landing-button--outline">
              Xem demo
            </button>
            <button type="button" className="landing-button landing-button--solid">
              Dùng thử ngay
            </button>
          </div>
        </section>

        <section id="contact" className="landing-section landing-section--contact">
          <div>
            <h2>Liên hệ</h2>
            <p>Email: support@taskflow.app</p>
            <p>Điện thoại: 0123 456 789</p>
            <p>Hãy để lại lời nhắn, đội ngũ TaskFlow sẽ phản hồi sớm nhất.</p>
          </div>

          <form
            className="landing-contact-form"
            onSubmit={handleContactSubmit}
            noValidate
          >
            <input
              type="text"
              name="fullName"
              placeholder="Họ và tên"
              value={formValues.fullName}
              onChange={handleInputChange}
              aria-invalid={Boolean(formErrors.fullName)}
            />
            {formErrors.fullName && (
              <p className="landing-form-message landing-form-message--error">
                {formErrors.fullName}
              </p>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formValues.email}
              onChange={handleInputChange}
              aria-invalid={Boolean(formErrors.email)}
            />
            {formErrors.email && (
              <p className="landing-form-message landing-form-message--error">
                {formErrors.email}
              </p>
            )}

            <textarea
              rows={4}
              name="message"
              placeholder="Nội dung"
              value={formValues.message}
              onChange={handleInputChange}
              aria-invalid={Boolean(formErrors.message)}
            />
            {formErrors.message && (
              <p className="landing-form-message landing-form-message--error">
                {formErrors.message}
              </p>
            )}

            <button
              type="submit"
              className="landing-button landing-button--solid landing-button--full"
            >
              Gửi liên hệ
            </button>

            {isSubmitted && (
              <p className="landing-form-message landing-form-message--success">
                Cảm ơn bạn đã góp ý!
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
