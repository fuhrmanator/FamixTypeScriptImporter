import * as _ from 'lodash';

export class Player {
    name: string;
    score: number;

    constructor(name: string) {
        this.name = name;
        this.score = 0;
    }

    addScore(points: number): void {
        this.score = _.add(this.score, points);
    }
}
