import { Global, Module } from '@nestjs/common';
import { v4 } from 'uuid';

@Global() 
@Module({
    providers: [
    {
        provide: 'UUID',
      useValue: v4,        // la fonction, pas le résultat
    },
    ],
  exports: ['UUID'],       // rend le provider accessible partout
})

export class CommonModule {}
