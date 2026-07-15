import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, inject } from '@angular/core';
import { ChatComponent } from './chat.component';

/**
 * Drives the `--cursor-x`/`--cursor-y` custom properties consumed by the
 * `.cursor-glow` background layer (styles.scss) — a fiery hex-scale spotlight
 * that follows the pointer. Attached outside Angular's zone and touches only
 * raw DOM style properties, so a rapid mousemove stream never triggers
 * change detection.
 */
@Component({
  selector: 'app-root',
  imports: [ChatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    const zone = inject(NgZone);
    const destroyRef = inject(DestroyRef);

    zone.runOutsideAngular(() => {
      const root = document.documentElement;
      const onPointerMove = (event: PointerEvent) => {
        root.style.setProperty('--cursor-x', `${event.clientX}px`);
        root.style.setProperty('--cursor-y', `${event.clientY}px`);
        root.classList.add('cursor-active');
      };
      document.addEventListener('pointermove', onPointerMove, { passive: true });
      destroyRef.onDestroy(() => document.removeEventListener('pointermove', onPointerMove));
    });
  }
}
