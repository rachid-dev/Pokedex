import { Component, computed, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PokemonService } from '../../pokemon.service';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map ,of } from 'rxjs';

@Component({
  selector: 'app-pokemon-profile',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './pokemon-profile.component.html',
  styles: ``
})
export class PokemonProfileComponent {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly pokemonService = inject(PokemonService);
  readonly pokemonId = Number(this.route.snapshot.paramMap.get('id'));
  readonly pokemonResponse = toSignal(this.pokemonService.getPokemonById(this.pokemonId).pipe(
    // En cas de succès
    map((value) => ({value, error : undefined})),
    // En cas d'erreur HTTP
    catchError((error)=>of({value : undefined, error}))
  ));

  // En attente de la réponse HTTP
  readonly loading = computed(() => !this.pokemonResponse());
  // Cas d'erreur HTTP
  readonly error = computed(() => this.pokemonResponse()?.error);
  // Cas de succès HTTP
  readonly pokemon = computed(() => this.pokemonResponse()?.value);

  deletePokemon(pokemonId: number) {
    this.pokemonService.deletePokemon(pokemonId).subscribe(() => {
      this.router.navigate(['/pokemons']);
    });
  }
}
