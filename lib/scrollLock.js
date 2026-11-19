// Stops the page scrolling behind an open drawer. Counted, so two drawers
// opening/closing in any order never leave the page stuck.
let locks = 0;
let saved = "";

export function lockScroll() {
  if (locks++ === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  return () => {
    if (--locks === 0) document.body.style.overflow = saved;
  };
}
