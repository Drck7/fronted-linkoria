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
    .channel-item { display:flex; justify-content:space-between; padding:4px 0 }
  `,
})
export class ChannelList {
  /** Lista de canales del servidor seleccionado */
  @Input() channels: Channel[] = [];

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
