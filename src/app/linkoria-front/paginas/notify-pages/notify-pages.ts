import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendshipService } from '../../../shared/services/friendship.service';

@Component({
  selector: 'notify-pages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notify-pages.html',
})
export class NotifyPage {
  readonly friendshipService = inject(FriendshipService);

  refresh(): void {
    this.friendshipService.loadPendingRequests();
  }

  accept(senderId: string): void {
    this.friendshipService.acceptFriendRequest(senderId).subscribe();
  }

  decline(senderId: string): void {
    this.friendshipService.declineFriendRequest(senderId).subscribe();
  }
}
