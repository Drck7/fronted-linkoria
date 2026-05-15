import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Server } from '../../interfaces/server.interface';

@Component({
  selector: 'server-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './server-list.html'
})
export class ServerList {
  /** Lista de servidores a mostrar (propiedad de solo lectura desde la Page) */
  @Input() servers: Server[] = [];

  /** Evento emitido cuando se selecciona un servidor (emite serverId) */
  @Output() selectServer = new EventEmitter<number>();

  /** Evento emitido cuando se solicita eliminar un servidor (emite serverId) */
  @Output() deleteServer = new EventEmitter<number>();

  /** Evento emitido cuando el usuario solicita crear un nuevo servidor */
  @Output() createRequest = new EventEmitter<void>();

  // --- Métodos públicos usados desde la plantilla ---
  onSelect(id: number) { this.selectServer.emit(id); }

  onDelete(id: number, ev?: Event) {
    // Evitar que el click del botón propague y dispare la selección
    ev?.stopPropagation();
    this.deleteServer.emit(id);
  }

  onCreate() { this.createRequest.emit(); }
}
