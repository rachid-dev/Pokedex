import { DatePipe , JsonPipe} from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PokemonService } from '../../pokemon.service';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { getPokemonColor, Pokemon, POKEMON_RULES } from '../../pokemon.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';


@Component({
  selector: 'app-pokemon-edit',
  standalone: true,
  imports: [DatePipe, JsonPipe, RouterLink, ReactiveFormsModule],
  templateUrl: './pokemon-edit.component.html',
  styles: ``,
})
export class PokemonEditComponent {

  constructor(){
    effect(() =>{
      const pokemon = this.pokemon();

      if(pokemon){
        this.form.patchValue(
          {
            name : pokemon.name,
            life : pokemon.life,
            damage : pokemon.damage,
            
          }
        );

        pokemon.types.forEach((type) => {
          this.pokemonTypeList.push(new FormControl(type));
        });
      }
    })
  }

  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly pokemonService = inject(PokemonService);
  readonly pokemonId = Number(this.route.snapshot.paramMap.get('id'));
  readonly pokemonResponse = toSignal(
    this.pokemonService.getPokemonById(this.pokemonId).pipe(
      map((value) => ({value, error : undefined})),
      catchError((error) => of({error, value : undefined}))
    )
  );

  readonly loading = computed(() => !this.pokemonResponse());
  readonly error = computed(() => this.pokemonResponse()?.error);
  readonly pokemon = computed(() => this.pokemonResponse()?.value);
  
  readonly POKEMON_RULES = signal(POKEMON_RULES).asReadonly();

  readonly form = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(POKEMON_RULES.MIN_NAME),
      Validators.maxLength(POKEMON_RULES.MAX_NAME),
      Validators.pattern(POKEMON_RULES.NAME_PATTERN),
    ]),
    life: new FormControl(),
    damage: new FormControl(),
    types: new FormArray(
      [],
      [
        Validators.required, 
        Validators.maxLength(POKEMON_RULES.MAX_TYPES)
      ]
    ),
  });

  // Get the selected Pokemon list by user.
get pokemonTypeList(): FormArray {
  return this.form.get('types') as FormArray;
}

get pokemonDamage(){
  return this.form.get('damage') as FormControl;
}

get pokemonName() {
  return this.form.get('name') as FormControl;
}

get pokemonLife() {
  return this.form.get('life') as FormControl;
}

// Return if given type is already selected by user or not.
isPokemonTypeSelected(type: string): boolean {
  return !!this.pokemonTypeList.controls.find(
    (control) => control.value === type
  );
}

// Add or remove a given type in the selected Pokemon list.
onPokemonTypeChange(type: string, isChecked: boolean): void {
  if (isChecked) {
    const control = new FormControl(type);
    this.pokemonTypeList.push(control);
  }
  else {
    const index = this.pokemonTypeList.controls
      .map((control) => control.value)
      .indexOf(type);
    this.pokemonTypeList.removeAt(index);
  }
}

//get backgroundColor based on pokemon type
getPokemonColor(type : string): string{
  return getPokemonColor(type);
}



incrementLife() {
  const newValue = this.pokemonLife.value + 1;
  this.pokemonLife.setValue(newValue);
}

decrementLife() {
  const newValue = this.pokemonLife.value - 1;
  this.pokemonLife.setValue(newValue);
}

incrementDamage() {
  const newValue = this.pokemonDamage.value + 1;
  this.pokemonDamage.setValue(newValue);
}

decrementDamage() {
  const newValue = this.pokemonDamage.value - 1;
  this.pokemonDamage.setValue(newValue);
}
  


onSubmit() {
  const isFormValid = this.form.valid;
  const pokemon = this.pokemon();

  if (isFormValid && pokemon) {
    const updatedPokemon: Pokemon = {
      ...pokemon,
      name: this.pokemonName.value as string,
      life: this.pokemonLife.value,
      damage: this.pokemonDamage.value,
      types: this.pokemonTypeList.value,
    };

    this.pokemonService.updatePokemon(updatedPokemon).subscribe(() => {
      this.router.navigate(['/pokemons', this.pokemonId]);
    });
  }
}

}