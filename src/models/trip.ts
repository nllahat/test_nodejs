import { Point } from "./categories/baseCategory";

export class Trip {
  days: TripDay[];
  daysCount: number;

  constructor(daysCount: number) {
    this.daysCount = daysCount;
    this.days = new Array<TripDay>(this.daysCount);
  }
}

export class TripDay {
  activities: Point[];
  mainActivities: Point[];
  maxActivities: number;
  maxMainActivities: number;

  constructor(maxMainActivities: number, maxActivities: number) {
    this.maxActivities = maxActivities;
    this.maxMainActivities = maxMainActivities;
    this.mainActivities = [];
    this.activities = [];
  }

  /**
   * addMainActivity
   */
  public addMainActivity(activity: Point) {
    if (this.mainActivities.length < this.maxMainActivities) {
      this.mainActivities.push(activity);
    } else {
      throw new Error("activities exceeded");
    }
  }

  /**
   * addActivity
   */
  public addActivity(activity: Point) {
    if (this.activities.length < this.maxActivities) {
      this.activities.push(activity);
    } else {
      throw new Error("activities exceeded");
    }
  }
}
