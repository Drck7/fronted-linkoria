import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChatConversation } from '../../interfaces/chat-conversation.interface';

@Component({
  selector: 'chat-thread',
  standalone: true,
  templateUrl: './chat-thread.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatThreadComponent {
  readonly conversation = input<ChatConversation | null>(null);
}
