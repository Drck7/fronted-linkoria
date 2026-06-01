import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
}
