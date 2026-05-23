import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { FrontNavbar } from "../../components/front-navbar/front-navbar";
import { ServersNavbar } from '../../components/servers-navbar/servers-navbar';
import { MessagesNavbar } from '../../components/messages-navbar/messages-navbar';
@Component({
  selector: 'app-linkoria-front-layout',
  imports: [RouterOutlet, FrontNavbar, ServersNavbar, MessagesNavbar],
  templateUrl: './linkoria-front-layout.html',
})
export class LinkoriaFrontLayout {
  private readonly router = inject(Router);

  readonly currentUrl = toSignal(
    this.router.events.pipe(
      startWith(null),
      filter((event): event is NavigationEnd | null => event === null || event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showMessagesNavbar = computed(() => {
    return !this.currentUrl().startsWith('/servers');
  });
}
