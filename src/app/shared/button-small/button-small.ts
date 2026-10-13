import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { CouleurBootstrap } from '../utils/models/couleur-bootstrap';

@Component({
  imports: [],
  selector: 'app-button-small',
  styleUrl: './button-small.css',
  templateUrl: './button-small.html',
})
export class ButtonSmall {
  // bind with text
  readonly libelle = input.required<string>();
  // bind with unicode
  readonly icone = input<string>();
  // bind with bootstrap color name
  readonly couleur = input<CouleurBootstrap>('primary');
  readonly btnSize = input<string>('btn-md');

  // use isOutline attribute in parent component on button instance or not
  readonly isOutline = input(false, { transform: booleanAttribute });

  readonly action = output<void>();

  // Computed to use prefixe btn or btn-outline prefix on class bootstrap
  protected readonly classeCouleur = computed(() =>
    this.isOutline()
      ? `btn-outline-${this.couleur()} ${this.btnSize()}`
      : `btn-${this.couleur()} ${this.btnSize()}`,
  );
}
