"use client";

import { customerClasses, customerSectionBg } from "@/lib/customerTheme";
import { useCustomerMotion } from "@/hooks/useCustomerMotion";
import { motion } from "framer-motion";

/**
 * Consistent home/marketing section shell — badge, title, subtitle, background.
 */
export function CustomerSectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  action,
  animated = true,
  className = "",
}) {
  const motionFx = useCustomerMotion();
  const Wrap = animated ? motion.div : "div";
  const motionProps = animated ? motionFx.scrollReveal : {};

  if (align === "split") {
    return (
      <Wrap
        {...motionProps}
        className={`mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end lg:gap-6 ${className}`}
      >
        <div className="min-w-0">
          {badge && <span className={customerClasses.badge}>{badge}</span>}
          <h2 className={customerClasses.title}>{title}</h2>
          {subtitle && <p className={`mt-2 max-w-xl ${customerClasses.subtitle}`}>{subtitle}</p>}
        </div>
        {action ? <div className="shrink-0 w-full sm:w-auto">{action}</div> : null}
      </Wrap>
    );
  }

  return (
    <Wrap {...motionProps} className={`mb-8 text-center sm:mb-10 ${className}`}>
      {badge && <span className={customerClasses.badge}>{badge}</span>}
      <h2 className={customerClasses.title}>{title}</h2>
      {subtitle && <p className={`mx-auto ${customerClasses.subtitle}`}>{subtitle}</p>}
    </Wrap>
  );
}

export default function CustomerSection({
  variant = "white",
  badge,
  title,
  subtitle,
  align = "center",
  action,
  children,
  className = "",
  containerClass = "",
  narrow = false,
  id,
}) {
  const bg = variant === "warm" ? customerSectionBg.warm : customerSectionBg.white;

  return (
    <section id={id} className={`${bg} ${customerClasses.sectionPad} ${className}`}>
      <div className={`${narrow ? customerClasses.containerNarrow : customerClasses.container} ${containerClass}`}>
        {(badge || title) && (
          <CustomerSectionHeader
            badge={badge}
            title={title}
            subtitle={subtitle}
            align={align}
            action={action}
          />
        )}
        {children}
      </div>
    </section>
  );
}
