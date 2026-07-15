import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { OpenUiService } from './openui.service';

/**
 * Renders a stream of OpenUI-Lang into a live generative UI by delegating to
 * the OpenUI React island. Re-renders whenever `response`/`isStreaming` change.
 */
@Component({
  selector: 'app-genui',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="genui-host"></div>`,
  styles: [
    `
      :host {
        display: block;
      }
      .genui-host {
        display: block;
      }
    `,
  ],
})
export class GenuiComponent {
  readonly response = input<string | null>(null);
  readonly isStreaming = input<boolean>(false);

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private readonly openui = inject(OpenUiService);

  constructor() {
    effect(() => {
      const hostRef = this.host();
      const response = this.response();
      const isStreaming = this.isStreaming();
      if (!hostRef || !this.openui.ready()) return;
      this.openui.render(hostRef.nativeElement, response, isStreaming);
    });

    inject(DestroyRef).onDestroy(() => {
      const hostRef = this.host();
      if (hostRef) this.openui.unmount(hostRef.nativeElement);
    });
  }
}
