import { useEffect } from "react";

/**
 * Fades sections in as they scroll into view: `[data-animate]` elements rise 40px, and the children
 * of `[data-stagger]` rise 30px one after another. This replaced GSAP + ScrollTrigger (~110 kB of the
 * first bundle) for the same effect; the motion itself lives in index.css (@keyframes reveal-up).
 *
 * The hidden start state is only applied here, after the page has rendered, so content is never
 * hidden when JavaScript is late or off. Children that arrive later (API data) inherit the revealed
 * state from their container.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const targets: Element[] = [];
    document.querySelectorAll("[data-animate]").forEach((el) => {
      el.classList.add("reveal");
      targets.push(el);
    });
    document.querySelectorAll("[data-stagger]").forEach((el) => {
      el.classList.add("reveal-stagger");
      targets.push(el);
    });
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }
    // "top 85%": reveal once the element's top edge passes 85% of the viewport height.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
