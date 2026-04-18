import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar-component/navbar-component';

@Component({
  selector: 'app-categories-component',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './categories-component.html',
  styleUrl: './categories-component.css',
})
export class CategoriesComponent {

}
