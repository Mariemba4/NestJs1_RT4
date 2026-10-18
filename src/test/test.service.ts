import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class TestService {
    constructor(@Inject('UUID') private uuid: Function) {}
    generateId() {
        return this.uuid();   // c'est ici que v4() s'exécute et génère un UUID
    }
}
