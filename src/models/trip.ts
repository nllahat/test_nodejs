import { Point } from "./categories/baseCategory";

export class Trip {
  days: TripDay[];
  daysCount: number;
  mainActivitiesMap: {};

  constructor(daysCount: number) {
    this.daysCount = daysCount;
    this.days = new Array<TripDay>(this.daysCount);
    this.mainActivitiesMap = {};
  }
}

export class TripDay {
  partOnePoint: Point[];
  maxPartOne: number;
  partTwoPoint: Point[];
  maxPartTwo: number

  constructor(partOnePointsLength: number, partTwoPointsLength: number) {
    this.partOnePoint = [];
    this.partTwoPoint = [];
    this.maxPartOne = partOnePointsLength;
    this.maxPartTwo = partTwoPointsLength;
  }

  public addToPartOne(point: Point) {
    if (this.partOnePoint.length < this.maxPartOne) {
      this.partOnePoint.push(point);
    } else {
      throw new Error("activities exceeded");
    }
  }

  public addToPartTwo(point: Point) {
    if (this.partTwoPoint.length < this.maxPartTwo) {
      this.partTwoPoint.push(point);
    } else {
      throw new Error("activities exceeded");
    }
  }
}
