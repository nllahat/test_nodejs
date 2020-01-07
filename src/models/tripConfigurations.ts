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
  private _totalPreferencesPoints: number;
  private _tripDistanceMatrix: DistanceMatrix;

  constructor(categoryPreferences: CategoriesMap) {
    this._categoryPreferences = categoryPreferences;
    this._totalPreferencesPoints = this._calculateTotalPreferencesPoints();
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

  public get TripDistanceMatrix(): DistanceMatrix {
    return this._tripDistanceMatrix;
  }

  public set TripDistanceMatrix(tripDistanceMatrix: DistanceMatrix) {
    this._tripDistanceMatrix = tripDistanceMatrix;
  }
}
