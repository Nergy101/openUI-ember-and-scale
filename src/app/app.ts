import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from './chat.component';
import { ProviderService } from './provider.service';

/**
 * Drives the `--cursor-x`/`--cursor-y` custom properties consumed by the
 * `.cursor-glow` background layer (styles.scss) — a fiery hex-scale spotlight
 * that follows the pointer. Attached outside Angular's zone and touches only
 * raw DOM style properties, so a rapid mousemove stream never triggers
 * change detection.
 */
@Component({
  selector: 'app-root',
  imports: [ChatComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly provider = inject(ProviderService);

  readonly selectedProviderHint = computed(
    () => this.provider.options.find((o) => o.id === this.provider.selected())?.hint ?? '',
  );

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
