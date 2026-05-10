import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ChatService } from '../../../chat/services/chat.service';

@Component({
  selector: 'messages-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './messages-navbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesNavbar {
  private readonly chatService = inject(ChatService);

  readonly conversations = this.chatService.conversations;
}
