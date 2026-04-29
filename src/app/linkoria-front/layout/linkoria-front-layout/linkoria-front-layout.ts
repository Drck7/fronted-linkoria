import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { FrontNavbar } from "../../components/front-navbar/front-navbar";

@Component({
  selector: 'app-linkoria-front-layout',
  imports: [RouterOutlet, FrontNavbar],
  templateUrl: './linkoria-front-layout.html',
})
export class LinkoriaFrontLayout { }
