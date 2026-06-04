import express from 'express';
import _ from 'lodash';

export class App {
    private app: express.Application;

    constructor() {
        this.app = express();
    }

    start(): void {
        _.noop();
        this.app.listen(3000);
    }
}
