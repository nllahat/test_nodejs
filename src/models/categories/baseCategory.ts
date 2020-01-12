export class GeoLocation {
  private _latitude: number;
  private _longitude: number;

  constructor(latitude: number, longitude: number) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  public get Latitude(): number {
    return this._latitude;
  }

  public get Longitude(): number {
    return this._longitude;
  }
}
export class Point {
  private _id: string;
  private _name: string;
  private _location: GeoLocation;
  private _distanceMatrixIndex: number;

  constructor(id: string, name: string, location: GeoLocation) {
    this._id = id;
    this._name = name;
    this._location = location;
  }

  public get Location(): GeoLocation {
    return this._location;
  }

  public get DistanceMatrixIndex(): number {
    return this._distanceMatrixIndex;
  }

  public set DistanceMatrixIndex(index: number) {
    this._distanceMatrixIndex = index;
  }

  public get ID(): string {
    return this._id;
  }

  public get Name(): string {
    return this._name;
  }
}

export class CategoryInstance {
  public baseCategory: BaseCategory;
  constructor(baseCategory: BaseCategory) {
    this.baseCategory = baseCategory;
  }
}

export class BaseCategory {
  private _usuallySpentHours: number;
  private _userPreference: number;
  private _name: string;
  private _points: Point[];
  private _maxPointsCount: number;
  private _selectedPointsCount: number;

  constructor(name: string, userPreference: number, usuallySpentHours: number, totalHoursPerDay: number) {
    this._userPreference = userPreference;
    this._usuallySpentHours = usuallySpentHours;
    this._name = name;
    this._points = [];
    this._maxPointsCount = Math.ceil((userPreference * totalHoursPerDay) / usuallySpentHours);
    this._selectedPointsCount = 0;
  }

  /**
   * addPoint
   */
  public addPoint(point: Point) {
    this._points.push(point);
  }

  /**
   * getUsuallySpentHoursArray
   */
  public getCategoryInstancesByUsuallySpentHours(): CategoryInstance[] {
    const arr: CategoryInstance[] = [];

    for (let index = 0; index < this._maxPointsCount - this._selectedPointsCount; index++) {
      arr.push(new CategoryInstance(this));
    }

    return arr;
  }

  /**
   * incSelectedPoint
   */
  public incSelectedPointCount() {
    this._selectedPointsCount++;
  }

  public initSelectedPointCount() {
    this._selectedPointsCount = 0;
  }

  get UserPreference(): number {
    return this._userPreference;
  }

  get UsuallySpentHours(): number {
    return this._usuallySpentHours;
  }

  get Points(): Point[] {
    return this._points;
  }

  get MaxPointsCount(): number {
    return this._maxPointsCount;
  }

  get Name(): string {
    return this._name;
  }
}
