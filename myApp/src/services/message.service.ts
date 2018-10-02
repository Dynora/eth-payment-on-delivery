import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {MESSAGE_EXPIRATION_TIMEOUT} from '../app/constants';

@Injectable()
export class MessageService {

    messages$: BehaviorSubject<string[]> = new BehaviorSubject([]);

    constructor() {
    }


    add(message: string, expire?: number): void {
        if (!message) {
            // No message set, do nothing.
            return;
        }

        if (this.messages.indexOf(message) === -1) {
            const messages = [...this.messages, message];

            if (expire > 0) {
                setTimeout(() => this.clear(message), expire);
            }

            this.messages$.next(messages);
        }
    }


    error(message: string): void {
        this.add(message, 0);
    }


    clear(message?: string): void {
        if (!message) {
            this.messages$.next([]);
            return;
        }

        const index = this.messages.indexOf(message);
        if (index > -1) {
            const messages: string[] = [...this.messages];
            messages.splice(index, 1);
            this.messages$.next(messages);
        }
    }


    get messages(): string[] {
        return this.messages$.getValue();
    }
}
