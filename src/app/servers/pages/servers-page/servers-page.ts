import { Component, Inject } from '@angular/core';
import { Server } from '../../interfaces/server.interface';
import { ServersService } from '../../services/servers.service';

@Component({
  selector: 'servers-page',
  imports: [],
  templateUrl: './servers-page.html'
})
export class ServersPage {
  ServersService= Inject(ServersService)

  get servers(): Server[] {
    return this.ServersService.servers;
  }
}
