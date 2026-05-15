import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerMember } from '../../interfaces/server-member.interface';

@Component({
  selector: 'members-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members-list.html'
})
export class MembersList {
  /** Lista de miembros del servidor */
  @Input() members: ServerMember[] = [];

  /** Emite userId para expulsar */
  @Output() kickMember = new EventEmitter<string>();

  /** Emite { userId, newRole } para cambiar rol */
  @Output() changeRole = new EventEmitter<{ userId: string; newRole: string }>();

  doKick(userId: string) { this.kickMember.emit(userId); }
  doChangeRole(userId: string, newRole: string) { this.changeRole.emit({ userId, newRole }); }
}
