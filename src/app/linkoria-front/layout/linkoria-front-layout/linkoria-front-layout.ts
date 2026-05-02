import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { FrontNavbar } from "../../components/front-navbar/front-navbar";
import { ServersNavbar } from '../../components/servers-navbar/servers-navbar';
import { MessagesNavbar } from '../../components/messages-navbar/messages-navbar';
@Component({
  selector: 'app-linkoria-front-layout',
  imports: [RouterOutlet, FrontNavbar, ServersNavbar, MessagesNavbar],
  templateUrl: './linkoria-front-layout.html',
})
export class LinkoriaFrontLayout { }
