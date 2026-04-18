import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar-component/navbar-component';

@Component({
  selector: 'app-budget-component',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './budget-component.html',
  styleUrl: './budget-component.css',
})
export class BudgetComponent {

}
