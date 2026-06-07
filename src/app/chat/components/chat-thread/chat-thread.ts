import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, input } from '@angular/core';
import { ChatConversation } from '../../interfaces/chat-conversation.interface';

@Component({
  selector: 'chat-thread',
  standalone: true,
  templateUrl: './chat-thread.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: flex;
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      min-height: 0;
    }
  `],
})
export class ChatThreadComponent {
  readonly conversation = input<ChatConversation | null>(null);

  // 1. Capturamos el div del HTML mediante su variable de referencia
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    // 2. Creamos un efecto que reaccione automáticamente a los cambios de la señal conversation()
    effect(() => {
      const conv = this.conversation();

      if (conv && conv.messages) {
        // Ejecutamos en el siguiente ciclo del DOM para asegurar que los elementos ya existan
        setTimeout(() => this.scrollToBottom(), 30);
      }
    });
  }

  // 3. Método encargado de desplazar el contenedor al final
  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const element = this.scrollContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
