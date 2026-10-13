import { Pipe, PipeTransform } from '@angular/core';

const NOMBRE_MAX_INITIALES = 2;

@Pipe({
  name: 'initiales',
})
export class InitialesPipe implements PipeTransform {
  transform(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .filter((mot) => mot !== '')
      .slice(0, NOMBRE_MAX_INITIALES)
      .map((mot) => mot[0].toUpperCase())
      .join('');
  }
}
