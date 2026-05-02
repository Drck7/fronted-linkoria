import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- Importante para que funcione el buscador

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule], // <--- Añade FormsModule aquí
  templateUrl: './home-page.html',
})
export class HomePage {
  searchText: string = ''; // Aquí guardaremos lo que escribas

  // Lista original (la fuente de verdad)
  amigosOriginal = [
    { nombre: '! Marcos Shadow', estado: 'online', subtexto: 'Jugando a Rust', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcos' },
    { nombre: '! Armint', estado: 'online', subtexto: 'Minecraft Time', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Armin' },
    { nombre: '.LeoCy.', estado: 'offline', subtexto: 'Desconectado', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' }
  ];

  // Esta es la función que usaremos en el HTML para mostrar solo los filtrados
  get amigosFiltrados() {
    return this.amigosOriginal.filter(amigo =>
      amigo.nombre.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
}
