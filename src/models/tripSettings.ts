import { Constants } from "../config/constants";

export interface UsuallySpentPerCategory {
  museums: number;
  sights: number;
  shopping: number;
}

export class TripSettings {
  private _days: number;
  private _city: string;
  private _mainActivitiesPerDay: number;
  private _spentHoursPerDay: number;
  private _totalHours: number;
  private _usuallySpent: UsuallySpentPerCategory;

  constructor(
    days: number,
    city: string,
    mainActivitiesPerDay: number = Constants.MAIN_ACTIVITIES_PER_DAY,
    usuallySpent: UsuallySpentPerCategory = Constants.USUALLY_SPENT,
    spentHoursPerDay: number = Constants.SPENT_HOURS_PER_DAY
  ) {
    this._days = days;
    this._city = city;
    this._mainActivitiesPerDay = mainActivitiesPerDay;
    this._usuallySpent = usuallySpent;
    this._spentHoursPerDay = spentHoursPerDay;
    this._totalHours = this._days * this._spentHoursPerDay;
  }

  public get Days(): number {
    return this._days;
  }

  public get City(): string {
    return this._city;
  }

  public get MainActivitiesPerDay(): number {
    return this._mainActivitiesPerDay;
  }

  public get SpentHoursPerDay(): number {
    return this._spentHoursPerDay;
  }

  public get UsuallySpent(): UsuallySpentPerCategory {
    return this._usuallySpent;
  }

  public get TotalHours(): number {
    return this._totalHours;
  }

  /**
   * Calculate total main activities for the whole trip
   */
  public calcTotalMainActivities() {
    return this._days * this._mainActivitiesPerDay;
  }
}
