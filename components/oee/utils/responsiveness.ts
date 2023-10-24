export function runResizeObserver(el: HTMLDivElement, callback: Function) {
  const rect = el.getBoundingClientRect();
  callback(rect);
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry.contentRect);
    }
  });
  observer.observe(el);
  return observer;
}
