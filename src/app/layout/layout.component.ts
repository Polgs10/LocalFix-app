import { Component, Input } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { BodyComponent } from "./body/body.component";

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, FooterComponent, BodyComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  @Input() title = 'Dashboard';
}
