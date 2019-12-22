export class Trip {
  days: TripDay[];
  daysCount: number;

  constructor(daysCount: number) {
    this.daysCount = daysCount;
    this.days = new Array<TripDay>(this.daysCount);
  }
}

export class TripDay {
  activities: Activity[];
  maxActivities: number;

  constructor(maxActivities: number) {
    this.maxActivities = maxActivities;
    this.activities = [];
  }

  /**
   * addActivity
   */
  public addActivity(activity: Activity) {
    if (this.activities.length < this.maxActivities) {
      this.activities.push(activity);
    } else {
      throw new Error("activities exceeded");
    }
  }
}

export class Activity {
  name: string;
  id: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
