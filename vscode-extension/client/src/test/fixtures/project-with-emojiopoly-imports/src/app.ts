import * as express from 'express';
import * as _ from 'lodash';

export class App {
    private app: express.Application;

    constructor() {
        this.app = express();
    }

    start(): void {
        this.app.listen(3000);
    }
}
