export function makeResizable(node: HTMLElement) {
  const resizer = node.querySelector('.resizer') as HTMLElement;
  if (!resizer) return;
  let startX: number, startWidth: number;

  const mouseDownHandler = (e: MouseEvent) => {
    e.stopPropagation(); 
    startX = e.clientX;
    startWidth = node.offsetWidth;
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const mouseMoveHandler = (e: MouseEvent) => {
    const dx = e.clientX - startX;
    node.style.width = `${startWidth + dx}px`;
  };

  const mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };
  resizer.addEventListener('mousedown', mouseDownHandler);
  return {
    destroy() {
      resizer.removeEventListener('mousedown', mouseDownHandler);
    }
  };
}