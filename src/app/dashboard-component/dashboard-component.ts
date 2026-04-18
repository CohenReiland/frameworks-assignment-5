import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar-component/navbar-component';

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.css',
})
export class DashboardComponent {

}
