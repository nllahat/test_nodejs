import { BaseCategory, Point } from "./categories/baseCategory";
import { TripSettings } from "./tripSettings";
import { DistanceMatrix } from "./distanceMatrix";

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
  private _numberOfMainActivitiesPerCategoryPerDay: CategoriesNumOfActivitiesMap;
  private _tripDistanceMatrix: DistanceMatrix;

  constructor(categoryPreferences: CategoriesMap, tripSettings: TripSettings) {
    this._categoryPreferences = categoryPreferences;
    this._tripSettings = tripSettings;
    this._totalPreferencesPoints = this._calculateTotalPreferencesPoints();
    this._numberOfActivitiesPerCategory = this._calculateNumberOfActivitiesPerCategory();
    this._numberOfMainActivitiesPerCategory = this._calculateNumberOfMainActivitiesPerCategory();
    this._numberOfMainActivitiesPerCategoryPerDay = this._calculateNumberOfMainActivitiesPerCategoryPerDay();
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
        this._totalPreferencesPoints /
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
      const result =
        (this._numberOfActivitiesPerCategory[key] * this._categoryPreferences[key].UserPreference) / this._totalPreferencesPoints;

      if (result > 0 && result < 1) {
        map[key] = 1;
      } else {
        map[key] = Math.round(result);
      }
    });

    return map;
  }

  /**
   * _calculateNumberOfMainActivitiesPerCategoryPerDay
   */
  private _calculateNumberOfMainActivitiesPerCategoryPerDay() {
    const map: CategoriesNumOfActivitiesMap = {};

    Object.keys(this._numberOfMainActivitiesPerCategory).forEach(key => {
      const result = this._numberOfMainActivitiesPerCategory[key] / this._tripSettings.Days;

      map[key] = Math.round(result);
      /* if (result > 0 && result < 1) {
        map[key] = 1;
      } else {
        map[key] = Math.round(result);
      } */
    });

    return map;
  }

  /**
   * getAllPoints
   */
  public getAllPoints(): Point[] {
    const allPoints: Point[] = [];

    Object.keys(this._categoryPreferences).forEach(category => {
      allPoints.push(...this._categoryPreferences[category].Points);
    });

    return allPoints;
  }

  public get CategoryPreferences(): CategoriesMap {
    return this._categoryPreferences;
  }

  public get NumberOfActivitiesPerCategory(): CategoriesNumOfActivitiesMap {
    return this._numberOfActivitiesPerCategory;
  }

  public get NumberOfMainActivitiesPerCategory(): CategoriesNumOfActivitiesMap {
    return this._numberOfMainActivitiesPerCategory;
  }

  public get TripDistanceMatrix(): DistanceMatrix {
    return this._tripDistanceMatrix;
  }

  public set TripDistanceMatrix(tripDistanceMatrix: DistanceMatrix) {
    this._tripDistanceMatrix = tripDistanceMatrix;
  }
}
