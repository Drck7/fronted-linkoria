import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerMember } from '../../interfaces/server-member.interface';

@Component({
  selector: 'members-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './members-list.html',
  styles: `
    :host {
      display: block;
    }

    .members-list ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .members-list li {
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(12, 23, 39, 0.5);
      border: 1px solid rgba(130, 165, 232, 0.14);
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #eef4ff;
      margin-bottom: 8px;
    }

    .member-info img {
      border-radius: 9999px;
      object-fit: cover;
      border: 1px solid rgba(130, 165, 232, 0.35);
    }

    .role {
      margin-left: auto;
      color: #9fb1d6;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
    }

    .actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .actions button {
      border: 1px solid rgba(130, 165, 232, 0.35);
      border-radius: 8px;
      background: rgba(17, 33, 56, 0.9);
      color: #e8f1ff;
      font-size: 0.8rem;
      padding: 5px 8px;
      cursor: pointer;
    }

    .actions button:last-child {
      border-color: rgba(255, 116, 158, 0.45);
      background: rgba(255, 78, 128, 0.2);
      color: #ffd5e3;
    }
  `
})
export class MembersList {
  /** Lista de miembros del servidor */
  @Input() members: ServerMember[] = [];

  /** Indica si el usuario actual puede ver y usar acciones de administración. */
  @Input() puedeGestionar = false;

  /** Emite userId para expulsar */
  @Output() kickMember = new EventEmitter<string>();

  /** Emite { userId, newRole } para cambiar rol */
  @Output() changeRole = new EventEmitter<{ userId: string; newRole: string }>();

  /**
   * Expulsa a un miembro solo cuando el usuario tiene permisos de owner.
   */
  doKick(userId: string) {
    if (!this.puedeGestionar) {
      return;
    }

    this.kickMember.emit(userId);
  }

  /**
   * Alterna el rol de un miembro solo cuando el usuario tiene permisos de owner.
   */
  doChangeRole(userId: string, newRole: string) {
    if (!this.puedeGestionar) {
      return;
    }

    this.changeRole.emit({ userId, newRole });
  }
}
