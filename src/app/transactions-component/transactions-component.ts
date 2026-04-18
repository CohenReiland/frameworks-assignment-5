import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar-component/navbar-component';

@Component({
  selector: 'app-transactions-component',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './transactions-component.html',
  styleUrl: './transactions-component.css',
})
export class TransactionsComponent {

}
