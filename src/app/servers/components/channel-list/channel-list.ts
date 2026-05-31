import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from '../../interfaces/channel.interface';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.html',
  styles: `
    :host { display: block; }
    .create {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .create input {
      flex: 1;
      min-width: 0;
      border: 1px solid rgba(130, 165, 232, 0.3);
      border-radius: 10px;
      padding: 9px 10px;
      background: rgba(18, 31, 52, 0.9);
      color: #eaf2ff;
    }

    .create input::placeholder {
      color: #98add6;
    }

    .create button {
      border: 0;
      border-radius: 10px;
      padding: 0 12px;
      background: linear-gradient(135deg, #5d5cff 0%, #8f74ff 100%);
      color: #fff;
      cursor: pointer;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .channel-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(11, 24, 42, 0.55);
      border: 1px solid rgba(130, 165, 232, 0.12);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .channel-item:hover {
      background: rgba(27, 47, 78, 0.75);
    }

    .channel-item span {
      color: #f0f4ff;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .channel-item button {
      border: 1px solid rgba(255, 116, 158, 0.45);
      border-radius: 8px;
      background: rgba(255, 78, 128, 0.2);
      color: #ffd5e3;
      font-size: 0.8rem;
      padding: 5px 8px;
      cursor: pointer;
    }
  `,
})
export class ChannelList {
  /** Lista de canales del servidor seleccionado */
  @Input() channels: Channel[] = [];

  /** Controla si el usuario puede crear o eliminar canales */
  @Input() canManageChannels = false;

  /** Emite el id del canal seleccionado */
  @Output() selectChannel = new EventEmitter<number>();

  /** Emite datos para crear un canal: { name, categoryId? } */
  @Output() createChannel = new EventEmitter<{ name: string; categoryId?: number }>();

  /** Emite el id del canal a eliminar */
  @Output() deleteChannel = new EventEmitter<number>();

  onSelect(id: number) { this.selectChannel.emit(id); }
  onDelete(id: number, ev?: Event) { ev?.stopPropagation(); this.deleteChannel.emit(id); }
  onCreate(nameInput: HTMLInputElement) {
    const name = nameInput.value?.trim();
    if (!name) return;
    this.createChannel.emit({ name });
    nameInput.value = '';
  }
}
