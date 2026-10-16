import { useEffect, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

/**
 * Thẻ nghiêng 3D theo con trỏ (perspective tilt).
 *
 * Vị trí con trỏ trong thẻ quy về khoảng -0.5..0.5, nhân `intensity` thành góc `rotateX`/`rotateY`.
 * Góc đi qua `useSpring` nên có quán tính, không giật theo từng pixel chuột.
 *
 * Hai điểm bắt buộc:
 *   1) `prefers-reduced-motion`: hiệu ứng nghiêng theo chuột gây buồn nôn ở người rối loạn tiền
 *      đình. Khi bật giảm chuyển động, component trả về thẻ TĨNH — vẫn giữ bóng đổ và bo góc,
 *      chỉ bỏ chuyển động, và không gắn sự kiện con trỏ.
 *   2) `will-change: transform` để trình duyệt đẩy lớp này lên GPU; thiếu nó thì mỗi lần di chuột
 *      là một lần vẽ lại, rất dễ giật.
 *
 * @param {object} props
 * @param {number} [props.intensity=7] Góc nghiêng tối đa mỗi trục (độ). Trên ~12 trông lệch.
 * @param {boolean} [props.glare=false] Vệt sáng chạy theo con trỏ.
 * @param {string} [props.className]
 */
export default function TiltCard({ children, className = '', intensity = 7, glare = false }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const [hasPointer, setHasPointer] = useState(false);

  /*
   * Chỉ bật nghiêng khi thiết bị có con trỏ CHÍNH XÁC (chuột/bút). Trên điện thoại, ngón tay kéo
   * để cuộn trang đi qua thẻ cũng phát sinh `pointermove` và làm thẻ nghiêng ngoài ý muốn — vừa
   * khó chịu vừa khiến người dùng tưởng màn hình bị lệch.
   */
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHasPointer(mq.matches);
    const onChange = (e) => setHasPointer(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const spring = { stiffness: 180, damping: 22, mass: 0.6 };
  const rx = useSpring(0, spring);
  const ry = useSpring(0, spring);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${useSpring(useTransform(px, (v) => v * 100), spring)}% ${useSpring(useTransform(py, (v) => v * 100), spring)}%, rgba(255,255,255,0.5), transparent 50%)`;

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Kẹp 0..1: con trỏ kéo ra ngoài nhanh có thể cho toạ độ ngoài thẻ, tạo góc vô lý.
    const nx = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const ny = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    px.set(nx);
    py.set(ny);
    rx.set(-(ny - 0.5) * 2 * intensity);
    ry.set((nx - 0.5) * 2 * intensity);
    hover.set(1);
  }

  function handleLeave() {
    rx.set(0);
    ry.set(0);
    hover.set(0);
  }

  if (reduceMotion || !hasPointer) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX: rx, rotateY: ry, willChange: 'transform', transformStyle: 'preserve-3d' }}
        className={`relative ${className}`}
      >
        {children}
        {glare && (
          <motion.span
            aria-hidden="true"
            style={{ backgroundImage: glareBg, opacity: hover }}
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
          />
        )}
      </motion.div>
    </div>
  );
}
