import { Constants } from "../config/constants";

export interface UsuallySpentPerCategory {
  [key: string]: number;
}

export class TripSettings {
  private _days: number;
  private _city: string;
  private _spentHoursPerDay: number;
  private _partOneHours: number;
  private _partTwoHours: number;
  private _totalHours: number;
  private _usuallySpent: UsuallySpentPerCategory;

  constructor(
    days: number,
    city: string,
    usuallySpent: UsuallySpentPerCategory = Constants.USUALLY_SPENT,
    spentHoursPerDay: number = Constants.SPENT_HOURS_PER_DAY,
    partOneHours: number = Constants.DAY_PART_ONE_HOURS,
    partTwoHours: number = Constants.DAY_PART_TWO_HOURS
  ) {
    this._days = days;
    this._city = city;
    this._usuallySpent = usuallySpent;
    this._spentHoursPerDay = spentHoursPerDay;
    this._totalHours = this._days * this._spentHoursPerDay;
    this._partOneHours = partOneHours;
    this._partTwoHours = partTwoHours;
  }

  public get Days(): number {
    return this._days;
  }

  public get City(): string {
    return this._city;
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

  public get PartOneHours(): number {
    return this._partOneHours;
  }

  public get PartTwoHours(): number {
    return this._partTwoHours;
  }
}
