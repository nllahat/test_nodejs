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
  partOnePoints: Point[];
  maxPartOneHours: number;
  partOneHoursSum: number;
  partTwoPoints: Point[];
  maxPartTwoHours: number;
  partTwoHoursSum: number;

  constructor(partOnePointsHours: number, partTwoPointsHours: number) {
    this.partOnePoints = [];
    this.partOneHoursSum = 0;
    this.partTwoPoints = [];
    this.partTwoHoursSum = 0;
    this.maxPartOneHours = partOnePointsHours;
    this.maxPartTwoHours = partTwoPointsHours;
  }

  public addToPartOne(point: Point, duration: number) {
    if (this.partOneHoursSum + duration <= this.maxPartOneHours) {
      this.partOnePoints.push(point);
      this.partOneHoursSum += duration;
    } else {
      throw new Error("activities exceeded");
    }
  }

  public addToPartTwo(point: Point, duration: number) {
    if (this.partTwoHoursSum + duration <= this.maxPartTwoHours) {
      this.partTwoPoints.push(point);
      this.partTwoHoursSum += duration;
    } else {
      throw new Error("activities exceeded");
    }
  }
}
