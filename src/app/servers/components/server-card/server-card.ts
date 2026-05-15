import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Server } from '../../interfaces/server.interface';

@Component({
  selector: 'server-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './server-card.html'
})
export class ServerCard {
  /** Representación mínima de un servidor para listas */
  @Input() server?: Server;
  @Output() select = new EventEmitter<number>();

  onSelect() { if (this.server) this.select.emit(this.server.id); }
}
