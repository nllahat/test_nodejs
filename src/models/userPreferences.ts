export class UserPreferences {
  private _museums: number;
  private _sights: number;
  private _shopping: number;
  private _totalPoints: number;

  constructor(museums: number, sights: number, shopping: number) {
    this._museums = museums;
    this._sights = sights;
    this._shopping = shopping;
    this._totalPoints = museums + sights + shopping;
  }

  public get TotalPoints(): number {
    return this._totalPoints;
  }

  public get Museums(): number {
    return this._museums / this._totalPoints;
  }

  public get Sights(): number {
    return this._sights / this._totalPoints;
  }

  public get Shopping(): number {
    return this._shopping / this._totalPoints;
  }

  public static calculateNumOfMainActivities (numOfActivities: number, preference: number) {
    const result = numOfActivities * preference;

    if (result > 0 && result < 1) {
        return 1;
    }

    return Math.round(result);
}

  /**
   * categoryNumberOfActivities
   */
  public static categoryNumberOfActivities(totalHours: number, usuallySpent: number, categoryPreference: number) {
    return totalHours * categoryPreference / usuallySpent;
  }

  /**
   * sightsNumberOfActivities
   */
  public sightsNumberOfActivities(totalHours: number, usuallySpent: number) {
    return totalHours * this.Sights / usuallySpent;
  }

  /**
   * shoppingNumberOfActivities
   */
  public shoppingNumberOfActivities(totalHours: number, usuallySpent: number) {
    return totalHours * this.Shopping / usuallySpent;
  }
}
