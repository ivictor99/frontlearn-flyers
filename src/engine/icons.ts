import type { FactItem } from './types';

/**
 * Small vector icons drawn directly on the canvas.
 * Each icon is authored in a 24×24 box and scaled to the requested size.
 */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: FactItem['icon'] | undefined,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  if (!icon) return;
  const s = size / 24;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (icon) {
    case 'calendar':
      ctx.beginPath();
      ctx.roundRect(3, 5, 18, 16, 2.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3, 10);
      ctx.lineTo(21, 10);
      ctx.moveTo(8, 3);
      ctx.lineTo(8, 7);
      ctx.moveTo(16, 3);
      ctx.lineTo(16, 7);
      ctx.stroke();
      break;
    case 'clock':
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, 7);
      ctx.lineTo(12, 12.5);
      ctx.lineTo(16, 15);
      ctx.stroke();
      break;
    case 'pin':
      ctx.beginPath();
      ctx.moveTo(12, 21.5);
      ctx.bezierCurveTo(12, 21.5, 19, 14.8, 19, 10);
      ctx.arc(12, 10, 7, 0, Math.PI, true);
      ctx.bezierCurveTo(5, 14.8, 12, 21.5, 12, 21.5);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 10, 2.4, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'tag':
      ctx.beginPath();
      ctx.moveTo(3.5, 12.6);
      ctx.lineTo(12, 4.2);
      ctx.lineTo(20.5, 4.2);
      ctx.lineTo(20.5, 12.7);
      ctx.lineTo(12, 21.2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16.2, 8.4, 1.5, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'money':
      ctx.beginPath();
      ctx.roundRect(2.5, 6, 19, 12, 2.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, 12, 2.8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'phone':
      ctx.beginPath();
      ctx.moveTo(6.4, 3.5);
      ctx.lineTo(9.4, 3.5);
      ctx.lineTo(10.8, 8);
      ctx.lineTo(8.4, 9.8);
      ctx.bezierCurveTo(9.8, 12.6, 11.4, 14.2, 14.2, 15.6);
      ctx.lineTo(16, 13.2);
      ctx.lineTo(20.5, 14.6);
      ctx.lineTo(20.5, 17.6);
      ctx.bezierCurveTo(20.5, 19.2, 19.2, 20.5, 17.6, 20.5);
      ctx.bezierCurveTo(10.2, 20.5, 3.5, 13.8, 3.5, 6.4);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'mail':
      ctx.beginPath();
      ctx.roundRect(3, 5, 18, 14, 2.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3.8, 7);
      ctx.lineTo(12, 13.4);
      ctx.lineTo(20.2, 7);
      ctx.stroke();
      break;
    case 'globe':
      ctx.beginPath();
      ctx.arc(12, 12, 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(12, 12, 4.2, 9, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3.2, 9.5);
      ctx.lineTo(20.8, 9.5);
      ctx.moveTo(3.2, 14.5);
      ctx.lineTo(20.8, 14.5);
      ctx.stroke();
      break;
    case 'check':
      ctx.beginPath();
      ctx.moveTo(5, 12.5);
      ctx.lineTo(9.8, 17.2);
      ctx.lineTo(19, 7);
      ctx.stroke();
      break;
    default:
      break;
  }
  ctx.restore();
}
