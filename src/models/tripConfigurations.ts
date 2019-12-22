import { BaseCategory } from "./categories/baseCategory";
import { TripSettings } from "./tripSettings";

export interface CategoriesMap {
  [key: string]: BaseCategory;
}

export interface CategoriesNumOfActivitiesMap {
  [key: string]: number;
}

export class TripConfigurations {
  private _categoryPreferences: CategoriesMap;
  private _tripSettings: TripSettings;
  private _totalPreferencesPoints: number;
  private _numberOfActivitiesPerCategory: CategoriesNumOfActivitiesMap;
  private _numberOfMainActivitiesPerCategory: CategoriesNumOfActivitiesMap;

  constructor(categoryPreferences: CategoriesMap, tripSettings: TripSettings) {
    this._categoryPreferences = categoryPreferences;
    this._tripSettings = tripSettings;
    this._totalPreferencesPoints = this._calculateTotalPreferencesPoints();
    this._numberOfActivitiesPerCategory = this._calculateNumberOfActivitiesPerCategory();
    this._numberOfMainActivitiesPerCategory = this._calculateNumberOfMainActivitiesPerCategory();
  }

  /**
   * calculateTotalPreferencesPoints
   */
  private _calculateTotalPreferencesPoints(): number {
    return Object.keys(this._categoryPreferences).reduce(
      (accumulator: number, currentKey: string) => accumulator + this._categoryPreferences[currentKey].UserPreference,
      0
    );
  }

  /**
   * calculateNumberOfActivitiesPerCategory
   */
  private _calculateNumberOfActivitiesPerCategory(): CategoriesNumOfActivitiesMap {
    const map: CategoriesNumOfActivitiesMap = {};

    Object.keys(this._categoryPreferences).forEach(key => {
      map[key] =
        (this._tripSettings.TotalHours * this._categoryPreferences[key].UserPreference) /
        this._categoryPreferences[key].UsuallySpentHours;
    });

    return map;
  }

  /**
   * calculateNumberOfMainActivitiesPerCategory
   */
  private _calculateNumberOfMainActivitiesPerCategory(): CategoriesNumOfActivitiesMap {
    const map: CategoriesNumOfActivitiesMap = {};

    Object.keys(this._numberOfActivitiesPerCategory).forEach(key => {
      const result = this._numberOfActivitiesPerCategory[key] * this._categoryPreferences[key].UserPreference;

      if (result > 0 && result < 1) {
        map[key] = 1;
      } else {
        map[key] = Math.round(result);
      }
    });

    return map;
  }

  public get CategoryPreferences (): CategoriesMap {
    return this._categoryPreferences;
  }

  public get NumberOfActivitiesPerCategory (): CategoriesNumOfActivitiesMap {
    return this._numberOfActivitiesPerCategory;
  }

  public get NumberOfMainActivitiesPerCategory (): CategoriesNumOfActivitiesMap {
    return this._numberOfMainActivitiesPerCategory;
  }
}
